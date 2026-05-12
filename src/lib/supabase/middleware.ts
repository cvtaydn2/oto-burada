import { createServerClient } from "@supabase/ssr";
import { type User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { handleAuthRedirects } from "@/lib/auth";
import { getSupabaseEnv, getSupabaseProjectRef, hasSupabaseEnv } from "@/lib/env";
import { applyRequestMetadata, applySecurityHeaders, generateNonce } from "@/lib/headers";
import { classifyRoute } from "@/lib/routes";

/**
 * Global Middleware Orchestrator.
 * Handles Session Refresh, Routing Guards, and Security.
 */
export async function updateSession(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    const nonce = generateNonce();
    return applySecurityHeaders(NextResponse.next({ request }), nonce, request);
  }

  const nonce = generateNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const pathname = request.nextUrl.pathname;
  const route = classifyRoute(pathname);

  // Pre-generate CSRF token only when visitor does not already have a CSRF cookie.
  // This prevents unnecessary token rotation on every request.
  let csrfToken: string | undefined;
  if (!route.isStaticAsset) {
    const { CSRF_COOKIE_HASH_NAME_CLIENT, generateCsrfToken } = await import("@/lib/csrf");
    const hasCsrfCookie = request.cookies.has(CSRF_COOKIE_HASH_NAME_CLIENT);

    if (!hasCsrfCookie) {
      csrfToken = generateCsrfToken();
      requestHeaders.set("x-csrf-token", csrfToken);
    }
  }

  // 1. PERFORMANCE: Skip heavy processing for static assets
  if (route.isStaticAsset) {
    return applySecurityHeaders(
      NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      }),
      nonce,
      request
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

        // Rebuild forwarded request headers from the already-enriched header set
        // so x-nonce / x-csrf-token are not lost when NextResponse.next() is recreated.
        const newRequestHeaders = new Headers(requestHeaders);
        const mergedCookieHeader = request.cookies
          .getAll()
          .map(({ name, value }) => `${name}=${value}`)
          .join("; ");

        if (mergedCookieHeader) {
          newRequestHeaders.set("cookie", mergedCookieHeader);
        } else {
          newRequestHeaders.delete("cookie");
        }

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
  let profileRole: "admin" | "user" | null | undefined;

  const getProfileRole = async (): Promise<"admin" | "user" | null> => {
    if (!user) return null;
    if (profileRole !== undefined) return profileRole;

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("[updateSession] Profile role fetch error:", error.message);
        profileRole = null;
        return profileRole;
      }

      profileRole = profile?.role === "admin" ? "admin" : "user";
      return profileRole;
    } catch (error) {
      console.error("[updateSession] Profile role fetch failure:", error);
      profileRole = null;
      return profileRole;
    }
  };

  const isAdminUser = async () => (await getProfileRole()) === "admin";

  // Optimization: Only verify user if we have a session cookie OR the route specifically requires auth.
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
    const { isMaintenanceGateActive, shouldShowMaintenanceScreen } =
      await import("@/lib/maintenance");

    if (isMaintenanceGateActive()) {
      let isMaintenanceMode = process.env.MAINTENANCE_MODE_FORCE === "true";

      // PERF: cache maintenance flag in-memory for a short TTL to avoid DB hit on every request.
      const maintenanceCache = (
        globalThis as typeof globalThis & {
          __maintenanceModeCache?: { value: boolean; expiresAt: number };
        }
      ).__maintenanceModeCache;

      if (!isMaintenanceMode && maintenanceCache && maintenanceCache.expiresAt > Date.now()) {
        isMaintenanceMode = maintenanceCache.value;
      }

      // Check database for maintenance mode if not forced via env and no valid cache.
      if (!isMaintenanceMode && (!maintenanceCache || maintenanceCache.expiresAt <= Date.now())) {
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

          (
            globalThis as typeof globalThis & {
              __maintenanceModeCache?: { value: boolean; expiresAt: number };
            }
          ).__maintenanceModeCache = {
            value: isMaintenanceMode,
            expiresAt: Date.now() + 60_000,
          };
        } catch (err) {
          console.error("[maintenanceCheck] Settings fetch error:", err);
        }
      }

      if (shouldShowMaintenanceScreen(isMaintenanceMode)) {
        const isAdmin = user ? await isAdminUser() : false;

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
              nonce,
              request
            );
          }

          const url = request.nextUrl.clone();
          url.pathname = "/maintenance";
          return applySecurityHeaders(NextResponse.redirect(url), nonce, request);
        }
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

    return applySecurityHeaders(finalResponse, nonce, request);
  }

  // 6. FINAL ENRICHMENT (Headers & Metadata)
  applySecurityHeaders(response, nonce, request);
  applyRequestMetadata(request, response, pathname);

  // 7. CSRF TOKEN (Synchronizer Token Pattern)
  // Ensure every visitor has a CSRF token hash in an HttpOnly cookie.
  // The raw token was already set in request headers for the layout.
  if (csrfToken) {
    const { applyCsrfCookieToResponse } = await import("@/lib/csrf");
    await applyCsrfCookieToResponse(response, csrfToken);
  }

  // Ensure no caching only for authenticated/dynamic views.
  // Public routes should remain cacheable to keep TTFB/FCP/LCP healthy.
  const isCacheSensitiveRoute = route.needsAuth || route.isAuthRoute || route.isApiRoute;
  if (user || hasSessionCookie || isCacheSensitiveRoute) {
    response.headers.set("Cache-Control", "private, max-age=0, no-cache");
  }

  return response;
}
