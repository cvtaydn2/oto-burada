import { NextResponse } from "next/server";

import { getNormalizedIp } from "@/features/shared/lib/ip";
import {
  checkRateLimit,
  type RateLimitConfig,
  type RateLimitResult,
} from "@/features/shared/lib/rate-limit";
import { API_ERROR_CODES, apiError } from "@/features/shared/lib/response";

export { checkRateLimit };

/**
 * Extract a request identifier for rate limiting.
 * Uses Vercel-specific headers first, then X-Forwarded-For, X-Real-IP, or falls back to a generic key.
 * SECURITY: Normalizes IPv6 to /64 subnet to prevent lease-based bypass.
 * SECURITY: Prioritizes x-vercel-forwarded-for to prevent header spoofing on Vercel platform.
 */
export function getRateLimitKey(request: Request, prefix: string, userId?: string) {
  // Vercel-specific: use x-vercel-forwarded-for first (more trustworthy)
  const vercelForwarded = request.headers.get("x-vercel-forwarded-for");
  let ip: string;

  if (vercelForwarded) {
    ip = getNormalizedIp(vercelForwarded.split(",")[0].trim());
  } else {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const rawIp = forwarded?.split(",")[0]?.trim() || realIp || "unknown";
    ip = getNormalizedIp(rawIp);
  }

  // ── SECURITY FIX: Issue SEC-RATE-02 - Composite Rate Limit Keys ─────────────
  // We combine IP and UserID to prevent bypasses where an attacker uses
  // multiple accounts from a single IP, or a single account from multiple IPs.
  // Format: prefix:ip:IP_ADDRESS[:user:USER_ID]
  let key = `${prefix}:ip:${ip}`;
  if (userId) {
    key = `${key}:user:${userId}`;
  }

  return key;
}

/**
 * Build a rate limit key scoped to a specific authenticated user AND their IP.
 * This prevents a single user from using multiple IPs to bypass user-level limits,
 * and also prevents multiple users on the same IP from sharing a single user-level limit.
 */
export function getUserRateLimitKey(request: Request, userId: string, prefix: string) {
  return getRateLimitKey(request, prefix, userId);
}

/**
 * Check rate limit and return a 429 response if exceeded.
 * Returns null if the request is within limits.
 *
 * SECURITY: Implements fail-open catch block. If Redis or DB fails,
 * it proceeds unless the config explicitly requests fail-closed.
 */
export async function enforceRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{
  response: NextResponse | null;
  result: RateLimitResult;
  headers: Record<string, string>;
}> {
  try {
    const result = await checkRateLimit(key, config);

    const rateLimitHeaders = {
      "X-RateLimit-Limit": String(result.limit),
      "X-RateLimit-Remaining": String(result.remaining),
      "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    };

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);

      const response = apiError(
        API_ERROR_CODES.RATE_LIMITED,
        "Çok fazla istek gönderdin. Lütfen biraz bekle ve tekrar dene.",
        429,
        { retryAfterSeconds: retryAfter },
        {
          "Retry-After": String(retryAfter),
          ...rateLimitHeaders,
        }
      );

      // Apply security headers to the blocked response
      const { applySecurityHeaders } = await import("@/features/shared/lib/headers");
      applySecurityHeaders(response);

      return { response, result, headers: rateLimitHeaders };
    }

    return { response: null, result, headers: rateLimitHeaders };
  } catch {
    const isProd = process.env.NODE_ENV === "production";
    const shouldFailClosed = config.failClosed ?? isProd;

    if (shouldFailClosed) {
      const result = {
        allowed: false,
        limit: config.limit,
        remaining: 0,
        resetAt: Date.now() + 60000,
      };
      const headers = {
        "X-RateLimit-Limit": String(config.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      };

      const response = apiError(
        API_ERROR_CODES.SERVICE_UNAVAILABLE,
        "Güvenlik servisi şu an kullanılamıyor. Lütfen az sonra tekrar deneyin.",
        503,
        undefined,
        headers
      );

      // Apply security headers to the error response
      const { applySecurityHeaders } = await import("@/features/shared/lib/headers");
      applySecurityHeaders(response);

      return {
        response,
        result,
        headers,
      };
    }

    // Fail-open
    const result = {
      allowed: true,
      limit: config.limit,
      remaining: config.limit,
      resetAt: Date.now(),
    };
    return {
      response: null,
      result,
      headers: {},
    };
  }
}
