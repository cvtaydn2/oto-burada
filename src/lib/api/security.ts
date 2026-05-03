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
  requireStepUp?: boolean; // New: Forces extra verification for critical actions
}

export interface SecurityResult {
  ok: true;
  user?: User;
  rateLimitHeaders?: Record<string, string>;
}

export interface SecurityError {
  ok: false;
  response: NextResponse;
  rateLimitHeaders?: Record<string, string>;
}

export type SecurityCheckResult = SecurityResult | SecurityError;

/**
 * Core security orchestrator.
 */
export async function withSecurity(
  request: Request,
  options: SecurityOptions = {}
): Promise<SecurityCheckResult> {
  const requiresUserSession = options.requireAuth || options.requireAdmin;
  const validateCsrfGuards = async (): Promise<SecurityError | null> => {
    if (options.requireCsrf) {
      const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
      if (isMutation && !isValidRequestOrigin(request)) {
        return {
          ok: false,
          response: apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz istek kaynağı (CSRF).", 403),
        };
      }
    }

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

    return null;
  };

  // Routes without auth requirement can apply CSRF checks immediately.
  if (!requiresUserSession) {
    const csrfError = await validateCsrfGuards();
    if (csrfError) {
      return csrfError;
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
  let allRateLimitHeaders: Record<string, string> = {};

  if (options.ipRateLimit) {
    const key = options.rateLimitKey ? `api:${options.rateLimitKey}` : "api:general";
    const ipLimit = await enforceRateLimit(getRateLimitKey(request, key), options.ipRateLimit);

    // Always collect headers
    allRateLimitHeaders = { ...allRateLimitHeaders, ...ipLimit.headers };

    if (ipLimit.response) {
      return { ok: false, response: ipLimit.response, rateLimitHeaders: ipLimit.headers };
    }
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

  if (requiresUserSession) {
    const { getAuthContext } = await import("@/lib/auth/session");
    const { user: authUser, dbProfile } = await getAuthContext();
    user = authUser;

    if (!user) {
      return {
        ok: false,
        response: apiError(API_ERROR_CODES.UNAUTHORIZED, "Oturum açmanız gerekiyor.", 401),
      };
    }

    // ── SECURITY FIX: Issue SEC-BAN-01 - Always Check DB Ban Status ──
    // JWT app_metadata.is_banned can be stale (up to 1 hour old).
    // Always use fresh DB profile ban status when available from getAuthContext.
    // This prevents banned users from accessing any authenticated endpoint
    // using a JWT issued before the ban.
    if (dbProfile?.isBanned) {
      return {
        ok: false,
        response: apiError(API_ERROR_CODES.FORBIDDEN, "Hesabınız askıya alınmıştır.", 403),
      };
    }

    if (options.requireAdmin) {
      if (!dbProfile || dbProfile.role !== "admin") {
        return {
          ok: false,
          response: apiError(API_ERROR_CODES.FORBIDDEN, "Admin yetkisi gerekli.", 403),
        };
      }
    }

    // 3.1 Step-up Authentication check (SEC-ATO-01)
    if (options.requireStepUp && user) {
      const { checkStepUpRequired, isSecuritySessionActive } =
        await import("@/lib/security/step-up-auth");

      // Skip check if user already has an active security session (e.g. just verified)
      const isVerified = await isSecuritySessionActive(user.id);

      if (!isVerified) {
        const isSuspicious = await checkStepUpRequired(user.id, request);
        if (isSuspicious) {
          return {
            ok: false,
            response: apiError(
              API_ERROR_CODES.STEP_UP_REQUIRED,
              "Güvenlik doğrulaması gerekiyor. Lütfen kimliğinizi doğrulayın.",
              403
            ),
          };
        }
      }
    }
  }

  // For authenticated routes, return 401 first, then evaluate CSRF guards.
  if (requiresUserSession) {
    const csrfError = await validateCsrfGuards();
    if (csrfError) {
      return csrfError;
    }
  }

  // 4. User-based Rate Limiting
  if (options.userRateLimit && user) {
    const key = options.rateLimitKey ?? "general";
    const userLimit = await enforceRateLimit(
      getUserRateLimitKey(request, user.id, key),
      options.userRateLimit
    );

    // Merge user headers
    allRateLimitHeaders = { ...allRateLimitHeaders, ...userLimit.headers };

    if (userLimit.response) {
      return { ok: false, response: userLimit.response, rateLimitHeaders: userLimit.headers };
    }
  }

  return { ok: true, user: user ?? undefined, rateLimitHeaders: allRateLimitHeaders };
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

/** withAdminRoute: Strictly for Admin-only operations (Token + Step-Up required) */
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
    requireStepUp: true,
  });
}

/** withCronOrAdmin: Shared tasks (Sync, Cleanup) triggered by Vercel Cron or Admin UI */
export async function withCronOrAdmin(
  request: Request,
  options: Omit<SecurityOptions, "requireCron"> = {}
) {
  // OR semantics:
  // 1) Allow trusted cron calls with a valid CRON_SECRET bearer token.
  // 2) Otherwise require an authenticated admin session.
  // ── BUG FIX: If requireAdmin is explicitly set, always verify admin role even with valid cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const isCronAuthValid = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (isCronAuthValid && !options.requireAdmin) {
    return { ok: true } as SecurityResult;
  }

  return withSecurity(request, { ...options, requireAdmin: true, requireStepUp: true });
}

/** withAuthAndCsrf: Backward-compatible alias with 401-before-CSRF semantics */
export async function withAuthAndCsrf(
  request: Request,
  options: Omit<
    SecurityOptions,
    "requireAuth" | "requireCsrfToken" | "requireAdmin" | "requireCron"
  > = {}
) {
  return withSecurity(request, { ...options, requireAuth: true, requireCsrfToken: true });
}

// Backward compatibility (deprecate later)
export const withAuth = withUserRoute;
