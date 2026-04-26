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
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // 3. AUTH / SESSION REFRESH (Secure & Performance-Optimized)
  let user: User | null = null;

  // Optimization: Only verify user if we have a session cookie OR the route specifically requires auth.
  // This avoids unnecessary network calls for anonymous visitors on public pages.
  const hasSessionCookie = request.cookies.getAll().some((c) => c.name.includes("-auth-token"));

  if (hasSessionCookie || route.needsAuth || route.isAuthRoute) {
    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser();
    user = fetchedUser;
  }

  // 4. ROUTE GUARDS (Redirects)
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

  // 5. FINAL ENRICHMENT (Headers & Metadata)
  applySecurityHeaders(response, nonce);
  applyRequestMetadata(request, response, pathname);

  // 6. CSRF TOKEN (Ensure every visitor has one)
  const hasCsrfCookie = request.cookies.has("csrf_token");
  if (!hasCsrfCookie && !route.isStaticAsset) {
    const { applyCsrfCookieToResponse } = await import("@/lib/security/csrf");
    applyCsrfCookieToResponse(response);
  }

  // Ensure no caching for authenticated/dynamic views
  response.headers.set("Cache-Control", "private, max-age=0, no-cache");

  return response;
}
