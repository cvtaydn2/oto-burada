import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/env";
import { applySecurityHeaders, applyRequestMetadata } from "@/lib/middleware/headers";
import { classifyRoute } from "@/lib/middleware/routes";
import { checkApiSecurity } from "@/lib/middleware/api-security";
import { handleAuthRedirects } from "@/lib/middleware/auth";

/**
 * Global Middleware Orchestrator.
 * Handles Session Refresh, Routing Guards, and Security.
 */
export async function updateSession(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.next({ request });
  }

  const pathname = request.nextUrl.pathname;
  const route = classifyRoute(pathname);

  // 1. PERFORMANCE: Skip heavy processing for static assets
  if (route.isStaticAsset) {
    return applySecurityHeaders(NextResponse.next({ request }));
  }

  // Initial response
  let response = NextResponse.next({ request });
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

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // 3. AUTH / SESSION REFRESH
  let user = null;
  if (route.needsAuth) {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
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
    
    return applySecurityHeaders(finalResponse);
  }

  // 5. API SECURITY (CSRF/Origin)
  const apiSecurity = checkApiSecurity(request);
  if (!apiSecurity.isValid) {
    return apiSecurity.response!;
  }

  // 6. FINAL ENRICHMENT (Headers & Metadata)
  applySecurityHeaders(response);
  applyRequestMetadata(request, response, pathname);

  // Ensure no caching for authenticated/dynamic views
  response.headers.set("Cache-Control", "private, max-age=0, no-cache");

  return response;
}
