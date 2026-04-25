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
 * Fast JWT claim decoding (unverified) to avoid unnecessary network calls in Middleware.
 * Security is still enforced by RLS at the database level.
 */
function getClaimsFromCookie(request: NextRequest): { role?: string; sub?: string } | null {
  try {
    // Supabase auth cookies usually follow 'sb-XXX-auth-token' or similar
    const authCookie = request.cookies.getAll().find((c) => c.name.includes("-auth-token"))?.value;

    if (!authCookie) return null;

    // Parse the token part if it's a JSON string (Supabase SSR format)
    let token = authCookie;
    if (authCookie.startsWith("{")) {
      const parsed = JSON.parse(authCookie);
      token = parsed.access_token || parsed[0];
    }

    if (!token || !token.includes(".")) return null;

    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      role: payload.app_metadata?.role,
      sub: payload.sub,
    };
  } catch {
    return null;
  }
}

/**
 * Global Middleware Orchestrator.
 * Handles Session Refresh, Routing Guards, and Security.
 */
export async function updateSession(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.next({ request });
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

  // 3. AUTH / SESSION REFRESH (Optimization)
  let user = null;
  const claims = getClaimsFromCookie(request);

  if (route.needsAuth) {
    if (!claims) {
      // Fast path: No cookie, no user. handleAuthRedirects will redirect to login.
      user = null;
    } else if ((route.isAdminRoute || route.isAdminApi) && claims.role !== "admin") {
      // Fast path: Admin route but user has no admin role. handleAuthRedirects will block.
      user = { id: claims.sub, app_metadata: { role: claims.role } } as unknown as User;
    } else {
      // Slow path: Need full verification for session refresh or critical paths
      const {
        data: { user: fetchedUser },
      } = await supabase.auth.getUser();
      user = fetchedUser;
    }
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

  // Ensure no caching for authenticated/dynamic views
  response.headers.set("Cache-Control", "private, max-age=0, no-cache");

  return response;
}
