/**
 * Admin Authorization Utilities for API Routes
 *
 * ── SECURITY FIX: Issue #23 - Defense in Depth for Admin APIs ─────────────
 * Admin layout provides UI-level protection, but API endpoints need their own
 * independent authorization checks. This prevents direct API access bypassing
 * the layout guard.
 *
 * IMPORTANT: Every admin API route MUST call verifyAdminAccess() before
 * processing any request.
 */

import "server-only";

import { getAuthContext, getUserRole } from "@/features/auth/lib/session";
import { logger } from "@/lib/logger";
import { API_ERROR_CODES, apiError } from "@/lib/response";

export interface AdminAuthResult {
  ok: true;
  userId: string;
  userEmail: string;
}

export interface AdminAuthError {
  ok: false;
  response: Response;
}

/**
 * Verifies that the current request is from an authenticated admin user.
 *
 * Performs two-layer verification:
 * 1. JWT-based role check (fast, from auth token)
 * 2. Database role verification (authoritative, prevents stale JWT bypass)
 *
 * Returns either success with user info or an error response to return immediately.
 *
 * @example
 * ```ts
 * export async function POST(request: Request) {
 *   const auth = await verifyAdminAccess();
 *   if (!auth.ok) return auth.response;
 *
 *   // Admin-only logic here
 *   const { userId, userEmail } = auth;
 * }
 * ```
 */
export async function verifyAdminAccess(): Promise<AdminAuthResult | AdminAuthError> {
  const { user, dbProfile } = await getAuthContext();

  // 1. Check if user is authenticated
  if (!user) {
    logger.security.warn("[AdminAuth] Unauthenticated admin API access attempt");
    return {
      ok: false,
      response: apiError(API_ERROR_CODES.UNAUTHORIZED, "Giriş yapmanız gerekiyor.", 401),
    };
  }

  // 2. Check JWT role (fast check)
  const jwtRole = getUserRole(user);
  if (jwtRole !== "admin") {
    logger.security.warn("[AdminAuth] Non-admin user attempted admin API access", {
      userId: user.id,
      email: user.email,
      jwtRole,
    });
    return {
      ok: false,
      response: apiError(API_ERROR_CODES.FORBIDDEN, "Bu işlem için yetkiniz yok.", 403),
    };
  }

  // 3. Verify against database (authoritative check)
  if (!dbProfile || dbProfile.role !== "admin") {
    logger.security.error("[AdminAuth] JWT claims admin but DB says otherwise", {
      userId: user.id,
      email: user.email,
      jwtRole,
      dbRole: dbProfile?.role,
    });
    return {
      ok: false,
      response: apiError(API_ERROR_CODES.FORBIDDEN, "Yetki doğrulaması başarısız oldu.", 403),
    };
  }

  // 4. Check if user is banned
  if (dbProfile.isBanned) {
    logger.security.warn("[AdminAuth] Banned admin attempted API access", {
      userId: user.id,
      email: user.email,
    });
    return {
      ok: false,
      response: apiError(API_ERROR_CODES.FORBIDDEN, "Hesabınız askıya alınmış.", 403),
    };
  }

  // All checks passed
  return {
    ok: true,
    userId: user.id,
    userEmail: user.email ?? "unknown",
  };
}

/**
 * Type guard to check if auth result is successful.
 * Useful for TypeScript narrowing.
 */
export function isAdminAuthSuccess(
  result: AdminAuthResult | AdminAuthError
): result is AdminAuthResult {
  return result.ok === true;
}
