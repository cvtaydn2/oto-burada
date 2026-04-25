import { type NextRequest, NextResponse } from "next/server";

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

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

  // Allowlisted infrastructure IPs can bypass rate limiting.
  const bypassIps = process.env.RATE_LIMIT_BYPASS_IPS?.split(",") || [];

  if (bypassIps.includes(ip) || process.env.NODE_ENV === "development") {
    return null;
  }

  const { success, limit, remaining, reset } = await checkGlobalRateLimit(ip);

  if (!success) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: {
          code: "RATE_LIMITED",
          message:
            "Çok fazla istek yapıldı. Sistem güvenliği için geçici olarak sınırlandırıldınız.",
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
