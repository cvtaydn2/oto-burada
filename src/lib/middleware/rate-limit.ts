import { type NextRequest, NextResponse } from "next/server";

import { checkGlobalRateLimit } from "@/lib/utils/distributed-rate-limit";

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
  const { success, limit, remaining, reset } = await checkGlobalRateLimit(ip);

  if (!success) {
    return new NextResponse(
      JSON.stringify({
        error: "Too many requests",
        message: "Sistem güvenliği için geçici olarak sınırlandırıldınız.",
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
