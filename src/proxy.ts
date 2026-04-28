import { type NextRequest, NextResponse } from "next/server";

import { classifyRoute } from "@/lib/middleware/routes";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Primary Middleware Entry Point.
 *
 * Orchestrates:
 * 1. Supabase Session Management (Server-side & Cookies)
 * 2. Security Headers (CSP, HSTS, etc.)
 * 3. Auth Redirection Logic
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const route = classifyRoute(pathname);

  // 1. Skip middleware for static assets for performance
  if (route.isStaticAsset) {
    return NextResponse.next();
  }

  // 2. Heavy Lifting (Session, RLS, Redir)
  // updateSession already applies security headers and handles auth redirects
  return await updateSession(request);
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
