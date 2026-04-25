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

export { isValidRequestOrigin } from "./csrf";

// ── Sanitization ─────────────────────────────────────────────────────────────

export {
  escapeHtml,
  sanitizeDescription,
  sanitizeForMeta,
  sanitizeText,
} from "@/lib/sanitization/sanitize";

// ── Rate limiting ─────────────────────────────────────────────────────────────

export {
  checkRateLimit,
  type RateLimitConfig,
  rateLimitProfiles,
  type RateLimitResult,
} from "@/lib/rate-limiting/rate-limit";
export {
  enforceRateLimit,
  getRateLimitKey,
  getUserRateLimitKey,
} from "@/lib/rate-limiting/rate-limit-middleware";

// ── IP extraction ─────────────────────────────────────────────────────────────

export { getClientIp } from "@/lib/api/ip";
