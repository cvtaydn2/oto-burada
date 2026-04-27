/**
 * Centralized API Security Middleware
 *
 * Provides canonical wrappers for standardized route protection.
 */

import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { API_ERROR_CODES, apiError } from "@/lib/api/response";
import type { RateLimitConfig } from "@/lib/rate-limiting/rate-limit";
import {
  enforceRateLimit,
  getRateLimitKey,
  getUserRateLimitKey,
} from "@/lib/rate-limiting/rate-limit-middleware";
import { isValidRequestOrigin } from "@/lib/security";
import { validateCsrfToken } from "@/lib/security/csrf";

export interface SecurityOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireCsrf?: boolean;
  requireCsrfToken?: boolean; // New: requires CSRF token header validation
  requireCron?: boolean;
  ipRateLimit?: RateLimitConfig;
  userRateLimit?: RateLimitConfig;
  rateLimitKey?: string;
  maxBodySizeBytes?: number | false;
  forceDbBanCheck?: boolean;
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
  // 1. CSRF Origin Protection
  if (options.requireCsrf) {
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
    if (isMutation && !isValidRequestOrigin(request)) {
      return {
        ok: false,
        response: apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz istek kaynağı (CSRF).", 403),
      };
    }
  }

  // 1.1 CSRF Token Validation (Double Submit Cookie pattern)
  if (options.requireCsrfToken) {
    const isValid = await validateCsrfToken(request);
    if (!isValid) {
      return {
        ok: false,
        response: apiError(
          API_ERROR_CODES.FORBIDDEN,
          "Geçersiz CSRF token. Lütfen sayfayı yenileyin.",
          403
        ),
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

  // ── BUG FIX: Issue BUG-06 - Cron Secret Bypass Admin Check ─────────────
  // Cron secret validation should not bypass admin checks when requireAdmin is set.
  // This prevents unauthorized access to admin-only cron endpoints.
  if (options.requireCron) {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");

    // If cron secret matches and admin is NOT required, allow immediately
    if (cronSecret && authHeader === `Bearer ${cronSecret}` && !options.requireAdmin) {
      return { ok: true };
    }

    // If admin is required, continue to admin check even if cron secret is valid
    // This ensures cron endpoints with requireAdmin still verify admin status
  }

  if (options.requireAuth || options.requireAdmin) {
    const { getAuthContext } = await import("@/lib/auth/session");
    const { user: authUser, dbProfile } = await getAuthContext();
    user = authUser;

    if (!user) {
      return {
        ok: false,
        response: apiError(API_ERROR_CODES.UNAUTHORIZED, "Oturum açmanız gerekiyor.", 401),
      };
    }

    if (options.requireAdmin) {
      // Admin check: uses cached dbProfile from getAuthContext
      if (!dbProfile || dbProfile.role !== "admin" || dbProfile.isBanned) {
        return {
          ok: false,
          response: apiError(API_ERROR_CODES.FORBIDDEN, "Admin yetkisi gerekli.", 403),
        };
      }
    } else {
      // 3.1 Lightweight Ban Check (JWT first)
      const isBannedInJwt = (user.app_metadata as { is_banned?: boolean })?.is_banned === true;
      if (isBannedInJwt) {
        return {
          ok: false,
          response: apiError(API_ERROR_CODES.FORBIDDEN, "Hesabınız askıya alınmıştır.", 403),
        };
      }

      // 3.2 Secondary Ban Check (DB fallback for critical mutations)
      const isMutation = ["POST", "PUT", "DELETE", "PATCH"].includes(request.method);
      const shouldCheckDb = isMutation || options.forceDbBanCheck;

      if (shouldCheckDb) {
        // Uses cached dbProfile from getAuthContext (single DB call per request)
        if (dbProfile?.isBanned) {
          return {
            ok: false,
            response: apiError(API_ERROR_CODES.FORBIDDEN, "Hesabınız askıya alınmıştır.", 403),
          };
        }
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

/** withUserAndCsrf: Authenticated + CSRF check (Mutations - Token required) */
export async function withUserAndCsrf(
  request: Request,
  options: Omit<
    SecurityOptions,
    "requireAuth" | "requireCsrf" | "requireCsrfToken" | "requireAdmin" | "requireCron"
  > = {}
) {
  return withSecurity(request, {
    ...options,
    requireAuth: true,
    requireCsrf: true,
    requireCsrfToken: true,
  });
}

/** withUserAndCsrfToken: Authenticated + CSRF check (Mutations - Token required) */
export async function withUserAndCsrfToken(
  request: Request,
  options: Omit<
    SecurityOptions,
    "requireAuth" | "requireCsrfToken" | "requireAdmin" | "requireCron"
  > = {}
) {
  return withSecurity(request, { ...options, requireAuth: true, requireCsrfToken: true });
}

/** withCsrfToken: CSRF token validation (Double Submit Cookie) */
export async function withCsrfToken(
  request: Request,
  options: Omit<SecurityOptions, "requireCsrfToken"> = {}
) {
  return withSecurity(request, { ...options, requireCsrfToken: true });
}

/** withAdminRoute: Strictly for Admin-only operations (Token required) */
export async function withAdminRoute(
  request: Request,
  options: Omit<
    SecurityOptions,
    "requireAdmin" | "requireAuth" | "requireCsrfToken" | "requireCron"
  > = {}
) {
  return withSecurity(request, {
    ...options,
    requireAdmin: true,
    requireCsrf: true,
    requireCsrfToken: true,
  });
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
export const withAuthAndCsrf = withUserAndCsrfToken; // Point withAuthAndCsrf to the stricter token-based check
