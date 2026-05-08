import { type NextRequest } from "next/server";

import { csrfMiddleware as baseCsrfMiddleware } from "@/lib/csrf";
import { classifyRoute } from "@/lib/routes";

const PROXY_CSRF_EXCLUDED_API_PATHS = new Set(["/api/listings/view"]);

/**
 * CSRF Middleware Wrapper.
 * Explicitly defined to provide clear visibility in the middleware pipeline.
 */
export async function csrfMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method.toUpperCase());
  const route = classifyRoute(pathname);

  if (route.isApiRoute && isMutation && (route.isProtectedApi || route.isAdminApi)) {
    return null;
  }

  if (route.isApiRoute && isMutation && PROXY_CSRF_EXCLUDED_API_PATHS.has(pathname)) {
    return null;
  }

  return await baseCsrfMiddleware(request);
}

export {
  generateCsrfToken,
  setCsrfTokenCookie as setCsrfCookie,
  validateCsrfToken,
} from "@/lib/csrf";
