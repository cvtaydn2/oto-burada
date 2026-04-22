import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import { checkGlobalRateLimit } from "@/lib/utils/distributed-rate-limit";

/**
 * Global Middleware for OtoBurada.
 * Order of operations:
 * 1. Global Rate Limiting (Edge/Redis)
 * 2. Auth Session Management & CSRF Protection
 *
 * Next.js 16+ uses `proxy.ts` as the middleware entry point.
 * The exported function must be named `proxy`.
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static assets, images, etc.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes("/api/og") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)
  ) {
    return NextResponse.next();
  }

  // 1. GLOBAL RATE LIMITING
  // Get client IP (Vercel provides this in headers)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

  // Apply rate limiting to all requests (Public + API)
  // We can exclude specific heavy assets if needed, but Redis is fast enough
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

  // 2. AUTH & SESSION REFRESH (Supabase)
  // This function also handles Protected Route redirects (/admin, /dashboard)
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
