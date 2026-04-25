/**
 * CSRF Middleware re-export.
 * Unifies CSRF implementation by exporting from the security domain.
 */
export {
  csrfMiddleware,
  generateCsrfToken,
  setCsrfTokenCookie as setCsrfCookie,
  validateCsrfToken,
} from "@/lib/security/csrf";
