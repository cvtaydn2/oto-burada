/**
 * Centralized API Security Middleware
 * 
 * Provides consistent security checks across all API routes:
 * - CSRF protection
 * - Rate limiting
 * - Authentication
 * - Authorization
 * 
 * Usage:
 * ```typescript
 * export async function POST(request: Request) {
 *   const security = await withSecurity(request, {
 *     requireAuth: true,
 *     requireCsrf: true,
 *     rateLimit: rateLimitProfiles.listingCreate,
 *   });
 *   
 *   if (!security.ok) return security.response;
 *   
 *   // Business logic with security.user
 * }
 * ```
 */

import { NextResponse } from "next/server";
import { isValidRequestOrigin } from "@/lib/security";
import { getCurrentUser } from "@/lib/auth/session";
import { enforceRateLimit, getRateLimitKey, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";
import { apiError, API_ERROR_CODES } from "@/lib/utils/api-response";
import type { RateLimitConfig } from "@/lib/utils/rate-limit";
import type { User } from "@supabase/supabase-js";

export interface SecurityOptions {
  /**
   * Require user authentication.
   * If true, returns 401 if user is not authenticated.
   */
  requireAuth?: boolean;
  
  /**
   * Require CSRF protection (origin validation).
   * Recommended for all mutation endpoints (POST, PUT, PATCH, DELETE).
   */
  requireCsrf?: boolean;
  
  /**
   * IP-based rate limiting configuration.
   * Applied before authentication check.
   */
  ipRateLimit?: RateLimitConfig;
  
  /**
   * User-based rate limiting configuration.
   * Applied after authentication check (requires requireAuth: true).
   */
  userRateLimit?: RateLimitConfig;
  
  /**
   * Custom rate limit key suffix.
   * Used to differentiate rate limits for different operations.
   * Example: "listings:create", "images:upload"
   */
  rateLimitKey?: string;
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
 * Centralized security middleware for API routes.
 * 
 * Performs security checks in the following order:
 * 1. CSRF check (if requireCsrf)
 * 2. IP rate limit (if ipRateLimit)
 * 3. Authentication (if requireAuth)
 * 4. User rate limit (if userRateLimit and requireAuth)
 * 
 * @param request - Next.js request object
 * @param options - Security configuration
 * @returns Security check result with user (if authenticated) or error response
 */
export async function withSecurity(
  request: Request,
  options: SecurityOptions = {},
): Promise<SecurityCheckResult> {
  // 1. CSRF Protection
  if (options.requireCsrf) {
    if (!isValidRequestOrigin(request)) {
      return {
        ok: false,
        response: apiError(
          API_ERROR_CODES.BAD_REQUEST,
          "Geçersiz istek kaynağı (CSRF).",
          403,
        ),
      };
    }
  }
  
  // 2. IP-based Rate Limiting
  if (options.ipRateLimit) {
    const key = options.rateLimitKey 
      ? `api:${options.rateLimitKey}` 
      : "api:general";
    
    const ipLimit = await enforceRateLimit(
      getRateLimitKey(request, key),
      options.ipRateLimit,
    );
    
    if (ipLimit) {
      return {
        ok: false,
        response: ipLimit.response,
      };
    }
  }
  
  // 3. Authentication
  let user: User | null = null;
  
  if (options.requireAuth) {
    user = await getCurrentUser();
    
    if (!user) {
      return {
        ok: false,
        response: apiError(
          API_ERROR_CODES.UNAUTHORIZED,
          "Oturum açmanız gerekiyor.",
          401,
        ),
      };
    }
  }
  
  // 4. User-based Rate Limiting
  if (options.userRateLimit && user) {
    const key = options.rateLimitKey ?? "general";
    
    const userLimit = await enforceRateLimit(
      getUserRateLimitKey(user.id, key),
      options.userRateLimit,
    );
    
    if (userLimit) {
      return {
        ok: false,
        response: userLimit.response,
      };
    }
  }
  
  // All checks passed
  return {
    ok: true,
    user: user ?? undefined,
  };
}

/**
 * Convenience wrapper for authenticated endpoints.
 * Equivalent to withSecurity with requireAuth: true.
 */
export async function withAuth(
  request: Request,
  options: Omit<SecurityOptions, "requireAuth"> = {},
): Promise<SecurityCheckResult> {
  return withSecurity(request, { ...options, requireAuth: true });
}

/**
 * Convenience wrapper for mutation endpoints.
 * Equivalent to withSecurity with requireAuth: true and requireCsrf: true.
 */
export async function withAuthAndCsrf(
  request: Request,
  options: Omit<SecurityOptions, "requireAuth" | "requireCsrf"> = {},
): Promise<SecurityCheckResult> {
  return withSecurity(request, {
    ...options,
    requireAuth: true,
    requireCsrf: true,
  });
}
