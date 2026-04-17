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
  // Content-Security-Policy: tight policy for a marketplace app.
  // - default-src 'self': only same-origin by default
  // - script-src: Next.js inline scripts need 'unsafe-inline' in dev; in prod
  //   nonces are preferred but require per-request generation. 'unsafe-eval'
  //   is needed for some Next.js internals. Vercel Analytics is self-hosted.
  // - img-src: allow Supabase Storage, Unsplash (seed data), and data URIs
  // - connect-src: Supabase API, PostHog, Upstash
  // - frame-ancestors 'none': equivalent to X-Frame-Options DENY
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://cdn.vercel-insights.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
    "font-src 'self' https://fonts.gstatic.com https://unpkg.com",
    "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://*.tile.openstreetmap.org https://unpkg.com",
    "connect-src 'self' https://*.supabase.co https://*.posthog.com https://*.upstash.io wss://*.supabase.co https://nominatim.openstreetmap.org",
    "media-src 'self' blob: https://*.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
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
    
    if (origin) {
      let originHost: string | null = null;
      try {
        originHost = new URL(origin).host;
      } catch {
        // Malformed origin — reject
        return new NextResponse(
          JSON.stringify({ error: "Invalid origin" }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        );
      }

      const isLocalhost = originHost.startsWith("localhost") || originHost.startsWith("127.0.0.1");

      if (process.env.NODE_ENV === "production" && appUrl) {
        const allowedHost = new URL(appUrl).host;
        if (originHost !== allowedHost) {
          return new NextResponse(
            JSON.stringify({ error: "Invalid origin" }),
            { status: 403, headers: { "Content-Type": "application/json" } },
          );
        }
      } else if (!isLocalhost && host && originHost !== host) {
        // In dev: block mismatched non-localhost origins
        return new NextResponse(
          JSON.stringify({ error: "CSRF mismatch" }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        );
      }
    }
  }

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // Request correlation ID — propagated to all downstream logs
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  response.headers.set("x-request-id", requestId);

  response.headers.set("Cache-Control", "private, max-age=0, no-cache");
  response.headers.set("x-pathname", pathname);

  return response;
}

