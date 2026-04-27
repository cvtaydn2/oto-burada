import { type NextRequest } from "next/server";

import { classifyRoute } from "@/lib/middleware/routes";
import { csrfMiddleware as baseCsrfMiddleware } from "@/lib/security/csrf";

/**
 * CSRF Middleware Wrapper.
 * Explicitly defined to provide clear visibility in the middleware pipeline.
 */
export async function csrfMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method.toUpperCase());
  const route = classifyRoute(pathname);

  // ── SECURITY FIX: Removed CSRF skip for /api/favorites
  // Favorites are user-specific state-changing operations that require CSRF protection.
  // Skipping CSRF allowed attackers to add/remove favorites via cross-site request forgery.

  // Protected/admin API routes already enforce CSRF in route handlers.
  // Skipping proxy-level rejection here preserves proper 401 responses for unauthenticated calls.
  if (route.isApiRoute && isMutation && (route.isProtectedApi || route.isAdminApi)) {
    return null;
  }

  return await baseCsrfMiddleware(request);
}

export {
  generateCsrfToken,
  setCsrfTokenCookie as setCsrfCookie,
  validateCsrfToken,
} from "@/lib/security/csrf";
