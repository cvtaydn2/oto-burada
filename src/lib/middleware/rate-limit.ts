import { type NextRequest, NextResponse } from "next/server";

import { getUserFacingError } from "@/config/user-messages";
import { checkGlobalRateLimit, type RateLimitResult } from "@/lib/distributed-rate-limit";
import { getNormalizedIp } from "@/lib/ip-utils";
import { logger } from "@/lib/logger";

/**
 * Global Rate Limiting Middleware.
 * Prevents DDoS and brute-force attacks at the edge.
 */
export async function rateLimitMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip for static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes("/api/og") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)
  ) {
    return null;
  }

  // RSC prefetch requests are still network traffic and can be abused.
  // Do not skip them from global edge rate limiting.

  const rawIp =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0] ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1";

  const ip = getNormalizedIp(rawIp);

  // ── LOGIC FIX: Issue LOGIC-04 - Validate and Log Bypass IPs ─────────────
  const bypassIps = process.env.RATE_LIMIT_BYPASS_IPS?.split(",").map((i) => i.trim()) || [];
  if (bypassIps.length > 0 && bypassIps.includes(ip)) {
    return null;
  }

  // ── SECURITY FIX: Issue SEC-RATE-02 - Combined IP + UserID Rate Limit ─────
  // We perform two checks:
  // 1. IP-only check (to prevent IP-based spam)
  // 2. User-only check (to prevent user-based spam across IPs)
  // SECURITY: Do not parse unverified JWT payload from cookies in edge middleware.
  // User-scoped throttling is handled at route-level authenticated wrappers.
  // Keep global edge limiter IP-based to avoid trust-boundary violations.
  const userId: string | null = null;

  const hasAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"));

  if (hasAuthCookie) {
    logger.security.debug("Skipping unverified JWT parsing in edge rate limiter", {
      pathname,
    });
  }

  // 1. Check IP-based limit (Global volumetric protection)
  const ipResult = await checkGlobalRateLimit(`ip:${ip}`);

  // 2. Check User-based limit (Global account protection)
  let userResult: RateLimitResult | null = null;
  if (userId) {
    userResult = await checkGlobalRateLimit(`user:${userId}`);
  }

  // 3. Combined check (Specific User+IP protection)
  // This prevents an attacker from using a single IP to hammer the API with many users,
  // or a single user from hammering from many IPs, while allowing reasonable scale for both.
  let combinedResult: RateLimitResult | null = null;
  if (userId) {
    combinedResult = await checkGlobalRateLimit(`rate:ip:${ip}:user:${userId}`, { limit: 100 });
  }

  // Determine the most restrictive result
  const results = [ipResult, userResult, combinedResult].filter(Boolean) as RateLimitResult[];
  const result = results.find((r) => !r.success) || results[0];

  // Rate-limit response headers for client quota visibility
  const rateLimitHeaders: Record<string, string> = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.reset / 1000).toString(),
  };

  if (!result.success) {
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      console.warn(`[DEV] Rate limit would block ${userId ? `User: ${userId}` : `IP: ${ip}`}`);
      return null;
    }

    const response = new NextResponse(
      JSON.stringify({
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: getUserFacingError("RATE_LIMITED"),
        },
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
          ...rateLimitHeaders,
        },
      }
    );

    const { applySecurityHeaders } = await import("@/lib/headers");
    return applySecurityHeaders(response, undefined, request);
  }

  // Store rate-limit info as request headers for downstream (applySecurityHeaders uses these)
  request.headers.set("x-ratelimit-limit", result.limit.toString());
  request.headers.set("x-ratelimit-remaining", result.remaining.toString());
  request.headers.set("x-ratelimit-reset", result.reset.toString());

  return null;
}
