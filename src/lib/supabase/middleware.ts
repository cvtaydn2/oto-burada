import { createServerClient } from "@supabase/ssr";
import { type User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { handleAuthRedirects } from "@/lib/middleware/auth";
import {
  applyRequestMetadata,
  applySecurityHeaders,
  generateNonce,
} from "@/lib/middleware/headers";
import { classifyRoute } from "@/lib/middleware/routes";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/env";

/**
 * Global Middleware Orchestrator.
 * Handles Session Refresh, Routing Guards, and Security.
 */
export async function updateSession(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    const nonce = generateNonce();
    return applySecurityHeaders(NextResponse.next({ request }), nonce);
  }

  const nonce = generateNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const pathname = request.nextUrl.pathname;
  const route = classifyRoute(pathname);

  // 1. PERFORMANCE: Skip heavy processing for static assets
  if (route.isStaticAsset) {
    return applySecurityHeaders(
      NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      }),
      nonce
    );
  }

  // Initial response
  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  const { url, anonKey } = getSupabaseEnv();

  // 2. SUPABASE SESSION SYNC
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Update request cookies for the current middleware execution
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        // Sync request headers so subsequent calls in this request see the new cookies
        const newRequestHeaders = new Headers(request.headers);
        const cookieString = cookiesToSet.map(({ name, value }) => `${name}=${value}`).join("; ");

        // Append or replace cookie header
        const existingCookie = newRequestHeaders.get("Cookie") || "";
        newRequestHeaders.set(
          "Cookie",
          existingCookie ? `${existingCookie}; ${cookieString}` : cookieString
        );

        // Update the response with the new request headers to pass them forward
        response = NextResponse.next({
          request: {
            headers: newRequestHeaders,
          },
        });

        // Set cookies on the response for the browser
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // 3. AUTH / SESSION REFRESH (Secure & Performance-Optimized)
  let user: User | null = null;

  // Optimization: Only verify user if we have a session cookie OR the route specifically requires auth.
  const { getSupabaseProjectRef } = await import("@/lib/supabase/env");
  const projectRef = getSupabaseProjectRef();

  // Robust check for session cookies (including chunked ones)
  const allCookies = request.cookies.getAll();
  const hasSessionCookie = projectRef
    ? allCookies.some((c) => c.name.startsWith(`sb-${projectRef}-auth-token`))
    : allCookies.length > 0;

  if (hasSessionCookie || route.needsAuth || route.isAuthRoute) {
    try {
      const {
        data: { user: fetchedUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        // Missing session is expected for guest users; avoid noisy error-level logs.
        if (authError.message?.toLowerCase().includes("auth session missing")) {
          console.warn("[updateSession] Guest session:", authError.message);
        } else {
          console.error("[updateSession] Auth error:", authError.message);
        }
      } else {
        user = fetchedUser;
      }
    } catch (error) {
      console.error("[updateSession] Critical auth error:", error);
    }
  }

  // 4. MAINTENANCE MODE CHECK
  // Skip check for maintenance page, static assets, and auth/admin routes
  if (
    !route.isStaticAsset &&
    pathname !== "/maintenance" &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api/auth") &&
    !pathname.startsWith("/auth")
  ) {
    // PERFORMANCE BUG-K07 FIX: Do not query DB on every request.
    // Rely strictly on Environment Variables (MAINTENANCE_MODE_FORCE=true) to toggle maintenance.
    let isMaintenanceMode = process.env.MAINTENANCE_MODE_FORCE === "true";

    // Check database for maintenance mode if not forced via env
    if (!isMaintenanceMode) {
      try {
        const { data } = await supabase
          .from("platform_settings")
          .select("value")
          .eq("key", "general_appearance")
          .single();

        if (
          data &&
          data.value &&
          typeof data.value === "object" &&
          "maintenance_mode" in data.value
        ) {
          isMaintenanceMode = Boolean((data.value as Record<string, unknown>).maintenance_mode);
        }
      } catch (err) {
        console.error("[maintenanceCheck] Settings fetch error:", err);
      }
    }

    if (isMaintenanceMode) {
      let isAdmin = false;
      if (user) {
        // Fetch role from profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("[maintenanceCheck] Profile fetch error:", profileError);
        }

        isAdmin = profile?.role === "admin";
        console.log(`[maintenanceCheck] User: ${user.id}, Admin: ${isAdmin}`);
      }

      if (!isAdmin && pathname !== "/login") {
        // For API routes, return a JSON error instead of a redirect
        if (route.isApiRoute) {
          return applySecurityHeaders(
            NextResponse.json(
              {
                error: "Site bakım modundadır. Lütfen daha sonra tekrar deneyiniz.",
                code: "MAINTENANCE_MODE",
              },
              { status: 503 }
            ),
            nonce
          );
        }

        const url = request.nextUrl.clone();
        url.pathname = "/maintenance";
        return applySecurityHeaders(NextResponse.redirect(url), nonce);
      }
    }
  }

  // 5. ROUTE GUARDS (Redirects)
  const redirectResponse = handleAuthRedirects(request, user, route);
  if (redirectResponse) {
    // SECURITY: Ensure Supabase session cookies from the new response
    // are copied to the redirect response, preventing silent auth drops.
    const finalResponse = redirectResponse;
    response.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie.name, cookie.value);
    });

    return applySecurityHeaders(finalResponse, nonce);
  }

  // 6. FINAL ENRICHMENT (Headers & Metadata)
  applySecurityHeaders(response, nonce);
  applyRequestMetadata(request, response, pathname);

  // 7. CSRF TOKEN (Ensure every visitor has one)
  const hasCsrfCookie = request.cookies.has("csrf_token");
  if (!hasCsrfCookie && !route.isStaticAsset) {
    const { applyCsrfCookieToResponse } = await import("@/lib/security/csrf");
    applyCsrfCookieToResponse(response);
  }

  // Ensure no caching for authenticated/dynamic views
  response.headers.set("Cache-Control", "private, max-age=0, no-cache");

  return response;
}
