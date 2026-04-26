import { type NextRequest } from "next/server";

import { csrfMiddleware } from "@/lib/middleware/csrf";
import { runMiddlewarePipeline } from "@/lib/middleware/pipeline";
import { rateLimitMiddleware } from "@/lib/middleware/rate-limit";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Global Middleware for OtoBurada.
 * Order of operations:
 * 1. Global Rate Limiting (Edge/Redis)
 * 2. CSRF Protection for API Mutations
 * 3. Auth Session Management & Route Guards
 *
 * Next.js requires this file to be named `middleware.ts` and export `middleware` function.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api");
  const isAuth = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isPublicPage =
    !isApi && !isAuth && !pathname.startsWith("/dashboard") && !pathname.startsWith("/admin");

  // 1. Light-weight pipeline for Public GET pages
  if (isPublicPage && request.method === "GET") {
    // Still need session update for user status, but we could skip CSRF (it already does for GET)
    // and potentially use a more relaxed rate limit.
    return await updateSession(request);
  }

  // 2. Full security pipeline for API, Auth, and Dashboards
  return await runMiddlewarePipeline(request, [rateLimitMiddleware, csrfMiddleware, updateSession]);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * 1. Static files (_next/static, images, favicon)
     * 2. Public assets (fonts, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ttf|otf)$).*)",
  ],
};
