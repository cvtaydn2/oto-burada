import { type NextRequest, NextResponse } from "next/server";

import { getUserFacingError } from "@/config/user-messages";
import { getNormalizedIp } from "@/lib/api/ip-utils";
import { logger } from "@/lib/logging/logger";
import { checkGlobalRateLimit } from "@/lib/rate-limiting/distributed-rate-limit";

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

  // Skip for Next.js RSC (React Server Component) prefetch requests.
  // These are internal navigation requests triggered by <Link> hover/prefetch,
  // not real user requests. Counting them inflates the rate limit unfairly.
  const isRscRequest = request.headers.has("rsc") || request.nextUrl.searchParams.has("_rsc");
  if (isRscRequest) {
    return null;
  }

  const rawIp =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0] ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1";

  const ip = getNormalizedIp(rawIp);

  // ── LOGIC FIX: Issue LOGIC-04 - Validate and Log Bypass IPs ─────────────
  // Allowlisted infrastructure IPs can bypass rate limiting.
  // SECURITY: Only use for trusted infrastructure (monitoring, health checks, CI/CD).
  const bypassIps = process.env.RATE_LIMIT_BYPASS_IPS?.split(",").map((ip) => ip.trim()) || [];

  if (bypassIps.length > 0 && bypassIps.includes(ip)) {
    logger.security.info("Rate limit bypassed for allowlisted IP", {
      ip,
      pathname,
      bypassCount: bypassIps.length,
    });
    return null;
  }

  // Development parity: Run logic with 10x limit but don't block (just warn)
  const isDev = process.env.NODE_ENV === "development";
  const { success, limit, remaining, reset } = await checkGlobalRateLimit(ip, {
    limit: isDev ? 600 : undefined, // 10x default limit for dev
  });

  if (!success) {
    if (isDev) {
      console.warn(`[DEV] Rate limit would block IP: ${ip}`);
      return null;
    }
    return new NextResponse(
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
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      }
    );
  }

  return null;
}
