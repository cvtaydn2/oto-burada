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
 *  - If no Origin header is present (same-origin form POST, server-to-server)
 *    we allow it — the browser always sends Origin on cross-origin requests.
 *  - Otherwise the origin must match the configured APP_URL or the request Host.
 */
export function isValidRequestOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  // No Origin header → not a browser cross-origin request, allow.
  if (!origin) return true;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const host = request.headers.get("host") ?? "";

  // Allow when origin matches configured app URL or the current host.
  if (appUrl && origin.startsWith(appUrl)) return true;
  if (host && origin.includes(host)) return true;

  // Allow localhost in development unconditionally.
  if (process.env.NODE_ENV !== "production" && origin.includes("localhost")) return true;

  return false;
}

// ── Sanitization ─────────────────────────────────────────────────────────────

export {
  sanitizeText,
  sanitizeDescription,
  sanitizeForMeta,
  escapeHtml,
} from "@/lib/utils/sanitize";

// ── Rate limiting ─────────────────────────────────────────────────────────────

export {
  checkRateLimit,
  rateLimitProfiles,
  type RateLimitConfig,
  type RateLimitResult,
} from "@/lib/utils/rate-limit";

export {
  enforceRateLimit,
  getRateLimitKey,
  getUserRateLimitKey,
} from "@/lib/utils/rate-limit-middleware";

// ── IP extraction ─────────────────────────────────────────────────────────────

export { getClientIp } from "@/lib/utils/ip";
