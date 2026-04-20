import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

export function handleAuthRedirects(
  request: NextRequest, 
  user: User | null, 
  routeInfo: { 
    isProtectedRoute: boolean; 
    isAdminRoute: boolean; 
    isAuthRoute: boolean;
    isProtectedApi: boolean;
    isAdminApi: boolean;
  }
) {
  const { pathname } = request.nextUrl;

  // 1. API Security Guards (No redirects, return JSON)
  if (!user && (routeInfo.isProtectedApi || routeInfo.isAdminApi)) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized", message: "Oturum acmaniz gerekiyor." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  if (user && routeInfo.isAdminApi) {
    const isAdmin = (user.app_metadata as { role?: string })?.role === "admin";
    if (!isAdmin) {
      return new NextResponse(
        JSON.stringify({ error: "Forbidden", message: "Admin yetkisi gerekiyor." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // 2. Page Security Guards (Redirects)
  // Unauthenticated users -> /login
  if (!user && routeInfo.isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Non-admin users -> /dashboard
  if (user && routeInfo.isAdminRoute) {
    const isAdmin = (user.app_metadata as { role?: string })?.role === "admin";
    if (!isAdmin) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Authenticated users on auth routes -> /dashboard
  if (user && routeInfo.isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return null;
}
