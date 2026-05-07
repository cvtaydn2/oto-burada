/**
 * Security utilities — single entry point for all request-hardening helpers.
 *
 * Import from `@/features/shared/lib` instead of reaching into individual utility
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
} from "@/features/shared/lib/sanitize";

// ── Rate limiting ─────────────────────────────────────────────────────────────

export {
  checkRateLimit,
  type RateLimitConfig,
  rateLimitProfiles,
  type RateLimitResult,
} from "@/features/shared/lib/rate-limit";
export {
  enforceRateLimit,
  getRateLimitKey,
  getUserRateLimitKey,
} from "@/features/shared/lib/rate-limit-middleware";

// ── IP extraction ─────────────────────────────────────────────────────────────

export { getClientIp } from "@/features/shared/lib/ip";

// ── Ownership / IDOR Protection ──────────────────────────────────────────────

export { assertOwnership, isOwner, type OwnershipOptions } from "./ownership";
