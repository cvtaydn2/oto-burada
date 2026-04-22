/**
 * Centralized API Security Middleware
 *
 * Provides canonical wrappers for standardized route protection.
 */

import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { isSupabaseAdminUser } from "@/lib/auth/api-admin";
import { getCurrentUser } from "@/lib/auth/session";
import { isValidRequestOrigin } from "@/lib/security";
import { API_ERROR_CODES, apiError } from "@/lib/utils/api-response";
import type { RateLimitConfig } from "@/lib/utils/rate-limit";
import {
  enforceRateLimit,
  getRateLimitKey,
  getUserRateLimitKey,
} from "@/lib/utils/rate-limit-middleware";

export interface SecurityOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireCsrf?: boolean;
  requireCron?: boolean;
  ipRateLimit?: RateLimitConfig;
  userRateLimit?: RateLimitConfig;
  rateLimitKey?: string;
  maxBodySizeBytes?: number | false;
}

export interface SecurityResult {
  ok: true;
  user?: User;
}

export interface SecurityError {
  ok: false;
  response: NextResponse;
}

export type SecurityCheckResult = SecurityResult | SecurityError;

/**
 * Core security orchestrator.
 */
export async function withSecurity(
  request: Request,
  options: SecurityOptions = {}
): Promise<SecurityCheckResult> {
  // 1. CSRF Protection
  if (options.requireCsrf) {
    if (!isValidRequestOrigin(request)) {
      return {
        ok: false,
        response: apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz istek kaynağı (CSRF).", 403),
      };
    }
  }

  // 1.1 Body Size Limit (Issue 6)
  // Prevents "JSON Payload Bombs" causing OOM in Serverless Functions
  const contentLength = request.headers.get("content-length");
  const maxBodySizeBytes =
    options.maxBodySizeBytes === undefined ? 1 * 1024 * 1024 : options.maxBodySizeBytes;

  if (
    maxBodySizeBytes !== false &&
    contentLength &&
    parseInt(contentLength, 10) > maxBodySizeBytes
  ) {
    // Note: If you have large file uploads on a route, bypass this check there.
    // For general JSON APIs, 1MB is more than enough.
    return {
      ok: false,
      response: apiError(API_ERROR_CODES.BAD_REQUEST, "İstek gövdesi çok büyük (Maks 1MB).", 413),
    };
  }

  // 2. IP-based Rate Limiting
  if (options.ipRateLimit) {
    const key = options.rateLimitKey ? `api:${options.rateLimitKey}` : "api:general";
    const ipLimit = await enforceRateLimit(getRateLimitKey(request, key), options.ipRateLimit);
    if (ipLimit) return { ok: false, response: ipLimit.response };
  }

  // 3. Auth & Admin Checks
  let user: User | null = null;

  // Special case: Cron Secret bypass
  if (options.requireCron) {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      return { ok: true };
    }
    // If not cron secret, fall back to admin check if requireAdmin is set
  }

  if (options.requireAuth || options.requireAdmin) {
    user = await getCurrentUser();
    if (!user) {
      return {
        ok: false,
        response: apiError(API_ERROR_CODES.UNAUTHORIZED, "Oturum açmanız gerekiyor.", 401),
      };
    }

    if (options.requireAdmin) {
      const isAdmin = await isSupabaseAdminUser();
      if (!isAdmin) {
        return {
          ok: false,
          response: apiError(API_ERROR_CODES.FORBIDDEN, "Admin yetkisi gerekli.", 403),
        };
      }
    }

    // Instance-level ban checks matter for normal user sessions.
    // Admin and cron/admin flows are already separately authorized.
    if (!options.requireAdmin) {
      const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
      const admin = createSupabaseAdminClient();
      const { data: isBanned } = await admin.rpc("is_user_banned", { p_user_id: user.id });

      if (isBanned) {
        return {
          ok: false,
          response: apiError(API_ERROR_CODES.FORBIDDEN, "Hesabınız askıya alınmıştır.", 403),
        };
      }
    }
  }

  // 4. User-based Rate Limiting
  if (options.userRateLimit && user) {
    const key = options.rateLimitKey ?? "general";
    const userLimit = await enforceRateLimit(
      getUserRateLimitKey(user.id, key),
      options.userRateLimit
    );
    if (userLimit) return { ok: false, response: userLimit.response };
  }

  return { ok: true, user: user ?? undefined };
}

/**
 * CANONICAL WRAPPERS
 */

/** withUserRoute: Standard authenticated check (GET/Read) */
export async function withUserRoute(
  request: Request,
  options: Omit<SecurityOptions, "requireAuth" | "requireAdmin" | "requireCron"> = {}
) {
  return withSecurity(request, { ...options, requireAuth: true });
}

/** withUserAndCsrf: Authenticated + CSRF check (Mutations) */
export async function withUserAndCsrf(
  request: Request,
  options: Omit<
    SecurityOptions,
    "requireAuth" | "requireCsrf" | "requireAdmin" | "requireCron"
  > = {}
) {
  return withSecurity(request, { ...options, requireAuth: true, requireCsrf: true });
}

/** withAdminRoute: Strictly for Admin-only operations */
export async function withAdminRoute(
  request: Request,
  options: Omit<SecurityOptions, "requireAdmin" | "requireAuth" | "requireCron"> = {}
) {
  return withSecurity(request, { ...options, requireAdmin: true, requireCsrf: true });
}

/** withCronOrAdmin: Shared tasks (Sync, Cleanup) triggered by Vercel Cron or Admin UI */
export async function withCronOrAdmin(
  request: Request,
  options: Omit<SecurityOptions, "requireCron" | "requireAdmin"> = {}
) {
  return withSecurity(request, { ...options, requireCron: true, requireAdmin: true });
}

// Backward compatibility (deprecate later)
export const withAuth = withUserRoute;
export const withAuthAndCsrf = withUserAndCsrf;
