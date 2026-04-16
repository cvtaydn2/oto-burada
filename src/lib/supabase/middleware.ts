import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/env";

const protectedPrefixes = ["/dashboard", "/admin"];
const adminPrefixes = ["/admin"];
const authRoutes = ["/login", "/register"];

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

export async function updateSession(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isAdminRoute = adminPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isAuthRoute = authRoutes.includes(pathname);

  // Redirect unauthenticated users away from protected routes
  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect non-admin users away from admin routes
  if (user && isAdminRoute) {
    const appMetadata = user.app_metadata as { role?: string } | undefined;
    const isAdmin = appMetadata?.role === "admin";

    if (!isAdmin) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Redirect authenticated users away from auth routes
  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  // CSRF Protection for API routes
  if (pathname.startsWith("/api") && ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    // In production, enforce origin check
    if (process.env.NODE_ENV === "production" && appUrl) {
      const allowedOrigin = new URL(appUrl).origin;
      if (origin !== allowedOrigin) {
        return new NextResponse(
          JSON.stringify({ error: "Invalid origin" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    } else if (origin && host) {
      // In dev, at least check if origin matches host if both are present
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return new NextResponse(
            JSON.stringify({ error: "CSRF mismatch" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
      } catch {
        // Ignore invalid URLs in origin if they happen
      }
    }
  }

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  response.headers.set("Cache-Control", "private, max-age=0, no-cache");
  response.headers.set("x-pathname", pathname);

  return response;
}

