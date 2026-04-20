import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

export function handleAuthRedirects(
  request: NextRequest, 
  user: User | null, 
  routeInfo: { isProtectedRoute: boolean; isAdminRoute: boolean; isAuthRoute: boolean }
) {
  const { pathname } = request.nextUrl;

  // 1. Unauthenticated users -> /login
  if (!user && routeInfo.isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Non-admin users -> /dashboard
  if (user && routeInfo.isAdminRoute) {
    const isAdmin = (user.app_metadata as { role?: string })?.role === "admin";
    if (!isAdmin) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 3. Authenticated users on auth routes -> /dashboard
  if (user && routeInfo.isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return null;
}
