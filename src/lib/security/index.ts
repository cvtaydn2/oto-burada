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
  // Webhook exclusion: third-party services (like Iyzico) won't send valid browser origin/referer headers
  const { pathname } = new URL(request.url);
  if (pathname.startsWith("/api/webhooks/")) {
    return true;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const method = request.method.toUpperCase();
  const isMutation = method !== "GET" && method !== "HEAD" && method !== "OPTIONS";

  // 1. Mandatory header check for mutations
  if (isMutation && !origin && !referer) {
    return false;
  }

  // 2. Validate Origin if present
  if (origin && origin !== "null") {
    try {
      const originUrl = new URL(origin);
      if (isAllowedOrigin(originUrl, request)) return true;
    } catch {
      return false;
    }
  }

  // 3. Fallback to Referer for browsers/scenarios where Origin is missing
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (isAllowedOrigin(refererUrl, request)) return true;
    } catch {
      // Ignore malformed referer
    }
  }

  // Safe non-mutation requests with no headers are allowed
  return !isMutation;
}

/** Internal helper for origin/referer validation */
function isAllowedOrigin(targetUrl: URL, request: Request): boolean {
  // Match against NEXT_PUBLIC_APP_URL
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (rawAppUrl) {
    try {
      const appUrl = new URL(rawAppUrl);
      if (targetUrl.protocol === appUrl.protocol && targetUrl.host === appUrl.host) {
        return true;
      }
    } catch {
      /* ignore */
    }
  }

  // Match against request Host header
  const host = request.headers.get("host");
  if (host && targetUrl.host === host) return true;

  // Allow localhost in non-production
  if (process.env.NODE_ENV !== "production" && targetUrl.hostname === "localhost") {
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
