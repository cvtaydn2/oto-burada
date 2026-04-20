import { NextResponse } from "next/server";

import { checkRateLimit, type RateLimitConfig, type RateLimitResult } from "@/lib/utils/rate-limit";

export { checkRateLimit };

/**
 * Extract a request identifier for rate limiting.
 * Uses X-Forwarded-For, X-Real-IP, or falls back to a generic key.
 */
export function getRateLimitKey(request: Request, prefix: string) {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "unknown";
  return `${prefix}:${ip}`;
}

/**
 * Build a rate limit key scoped to a specific authenticated user.
 */
export function getUserRateLimitKey(userId: string, prefix: string) {
  return `${prefix}:user:${userId}`;
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
  config: RateLimitConfig,
): Promise<{ response: NextResponse; result: RateLimitResult } | null> {
  try {
    const result = await checkRateLimit(key, config);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);

      const response = NextResponse.json(
        {
          message: "Çok fazla istek gönderdin. Lütfen biraz bekle ve tekrar dene.",
          retryAfterSeconds: retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(result.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
          },
        },
      );

      return { response, result };
    }
  } catch {
    // If checkRateLimit throws (infrastructure failure)
    // checkRateLimit itself handles failClosed logic, but we catch it here to 
    // provide a clean fallback for any unexpected logic errors.
    if (config.failClosed) {
      return {
        response: NextResponse.json(
          { message: "Güvenlik servisi şu an kullanılamıyor. Lütfen az sonra tekrar deneyin." },
          { status: 503 }
        ),
        result: { allowed: false, limit: config.limit, remaining: 0, resetAt: Date.now() + 60000 }
      };
    }
    // Fail-open: proceed
  }

  return null;
}
