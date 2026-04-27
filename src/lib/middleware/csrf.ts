import { type NextRequest } from "next/server";

import { csrfMiddleware as baseCsrfMiddleware } from "@/lib/security/csrf";

/**
 * CSRF Middleware Wrapper.
 * Explicitly defined to provide clear visibility in the middleware pipeline.
 */
export async function csrfMiddleware(request: NextRequest) {
  return await baseCsrfMiddleware(request);
}

export {
  generateCsrfToken,
  setCsrfTokenCookie as setCsrfCookie,
  validateCsrfToken,
} from "@/lib/security/csrf";
