/**
 * Security utilities — single entry point for all request-hardening helpers.
 *
 * Import from `@/lib/security` instead of reaching into individual utility
 * files. This keeps security concerns discoverable and co-located.
 *
 * Contents:
 *  - CSRF origin check
 *  - Input sanitization
 *  - Rate-limit enforcement
 *  - IP extraction
 */

// ── CSRF ─────────────────────────────────────────────────────────────────────

/**
 * Returns true when the request origin is acceptable.
 *
 * Rules:
 *  - For mutations, Origin header is mandatory.
 *  - Otherwise the origin must match the configured APP_URL or the request Host
 *    using exact host + protocol comparison (not substring matching).
 *
 * Previous implementation used `startsWith` / `includes` which allowed
 * subdomain-spoofing attacks (e.g. "https://oto-burada.vercel.app.evil.com").
 * This version parses both sides with `new URL()` and compares hosts exactly.
 */
export function isValidRequestOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const method = request.method.toUpperCase();
  const isMutation = method !== "GET" && method !== "HEAD" && method !== "OPTIONS";

  // Mutation requests must present an Origin header. Internal callers should
  // use dedicated authenticated/secret-protected endpoints instead.
  if (!origin) {
    return !isMutation;
  }

  // Explicitly reject "null" origin (sandboxed iframe, file://, etc.)
  if (origin === "null") return false;

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    // Unparseable origin → reject.
    return false;
  }

  // 1. Match against NEXT_PUBLIC_APP_URL (exact host + protocol).
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (rawAppUrl) {
    try {
      const appUrl = new URL(rawAppUrl);
      if (
        originUrl.protocol === appUrl.protocol &&
        originUrl.host === appUrl.host // host includes port when non-default
      ) {
        return true;
      }
    } catch {
      // Misconfigured APP_URL — fall through to host check.
    }
  }

  // 2. Match against the request Host header (exact equality).
  const host = request.headers.get("host");
  if (host && originUrl.host === host) return true;

  // 3. Allow localhost in non-production environments only.
  if (process.env.NODE_ENV !== "production" && originUrl.hostname === "localhost") {
    return true;
  }

  return false;
}

// ── Sanitization ─────────────────────────────────────────────────────────────

export {
  escapeHtml,
  sanitizeDescription,
  sanitizeForMeta,
  sanitizeText,
} from "@/lib/utils/sanitize";

// ── Rate limiting ─────────────────────────────────────────────────────────────

export {
  checkRateLimit,
  type RateLimitConfig,
  rateLimitProfiles,
  type RateLimitResult,
} from "@/lib/utils/rate-limit";
export {
  enforceRateLimit,
  getRateLimitKey,
  getUserRateLimitKey,
} from "@/lib/utils/rate-limit-middleware";

// ── IP extraction ─────────────────────────────────────────────────────────────

export { getClientIp } from "@/lib/utils/ip";
