import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

export async function isRequestContext(): Promise<boolean> {
  try {
    const { cookies } = await import("next/headers");
    await cookies();
    return true;
  } catch {
    return false;
  }
}

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

  // 1b. Email Verification Guard (API)
  if (user && !user.email_confirmed_at && (routeInfo.isProtectedApi || routeInfo.isAdminApi)) {
    return new NextResponse(
      JSON.stringify({
        error: "Forbidden",
        message: "Devam etmek için e-posta adresinizi doğrulamanız gerekiyor.",
        code: "EMAIL_NOT_CONFIRMED",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Page Security Guards (Redirects)
  // 2a. Unauthenticated users -> /login
  if (!user && routeInfo.isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 2b. Unconfirmed users -> /verify-email
  if (
    user &&
    !user.email_confirmed_at &&
    routeInfo.isProtectedRoute &&
    pathname !== "/verify-email"
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/verify-email";
    return NextResponse.redirect(redirectUrl);
  }

  // Admin route check is handled by server components (requireAdminUser)
  // to support database-based role verification which is more reliable than JWT metadata.
  // We allow the request to proceed here.

  // Authenticated users on auth routes -> /dashboard
  if (user && routeInfo.isAuthRoute) {
    const authRouteAllowedWithSession =
      pathname === "/reset-password" || pathname === "/verify-email";

    if (!authRouteAllowedWithSession) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return null;
}
