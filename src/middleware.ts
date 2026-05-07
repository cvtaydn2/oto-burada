import { type NextRequest, NextResponse } from "next/server";

import { checkApiSecurity } from "@/features/shared/lib/api-security";
import { csrfMiddleware } from "@/features/shared/lib/csrf";
import { updateSession } from "@/features/shared/lib/middleware";
import { runMiddlewarePipeline } from "@/features/shared/lib/pipeline";
import { rateLimitMiddleware } from "@/features/shared/lib/rate-limit";
import { classifyRoute } from "@/features/shared/lib/routes";

/**
 * Primary Middleware Entry Point.
 *
 * Orchestrates:
 * 1. Rate Limiting (DDoS & Brute Force)
 * 2. API Security (Origin Checks)
 * 3. CSRF Protection (Double Submit Cookie)
 * 4. Supabase Session Management & Auth Redirection
 * 5. Security Headers (CSP, HSTS, etc.)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const route = classifyRoute(pathname);

  // 1. Skip middleware for static assets for performance
  if (route.isStaticAsset) {
    return NextResponse.next();
  }

  // 2. Run Security Pipeline
  return await runMiddlewarePipeline(request, [
    rateLimitMiddleware,
    checkApiSecurity,
    csrfMiddleware,
    updateSession,
  ]);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (svg, png, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ttf|otf)$).*)",
  ],
};
