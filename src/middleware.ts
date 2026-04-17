/**
 * Next.js Edge Middleware entry point.
 *
 * This file MUST be named `middleware.ts` at `src/` level for Next.js to pick it up.
 * The actual implementation lives in `src/proxy.ts` to keep this file minimal.
 *
 * Execution order:
 * 1. Global edge rate limiting (Upstash Redis sliding window)
 * 2. Auth session refresh + protected route redirects
 * 3. CSRF origin validation for API mutations
 * 4. Security response headers (CSP, HSTS, X-Frame-Options, etc.)
 */
export { proxy as middleware, config } from "@/proxy";
