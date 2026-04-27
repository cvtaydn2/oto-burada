import { type NextRequest } from "next/server";

import { csrfMiddleware } from "@/lib/middleware/csrf";
import { runMiddlewarePipeline } from "@/lib/middleware/pipeline";
import { rateLimitMiddleware } from "@/lib/middleware/rate-limit";
import { classifyRoute } from "@/lib/middleware/routes";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Global Proxy (Next.js 16+ replacement for middleware.ts).
 * Order of operations:
 * 1. Global Rate Limiting (Edge/Redis)
 * 2. CSRF Protection for API Mutations
 * 3. Auth Session Management & Route Guards
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { isApiRoute, isAuthRoute, isAdminRoute, isProtectedRoute } = classifyRoute(pathname);

  // 1. Admin & Dashboard: Force full security pipeline
  if (isAdminRoute || isProtectedRoute) {
    return await runMiddlewarePipeline(request, [
      rateLimitMiddleware,
      csrfMiddleware,
      updateSession,
    ]);
  }

  // 2. Auth routes: prevent brute force
  if (isAuthRoute) {
    return await runMiddlewarePipeline(request, [rateLimitMiddleware, updateSession]);
  }

  // 3. Public GET pages: lightweight pipeline
  if (request.method === "GET" && !isApiRoute) {
    return await updateSession(request);
  }

  // 4. Default: Full security pipeline
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
