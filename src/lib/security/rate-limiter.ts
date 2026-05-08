/**
 * Rate limiter adapter / alias for backwards compatibility.
 * Re-exports from @/lib/rate-limit and rate-limit-middleware.
 */

export {
  checkRateLimit,
  type RateLimitConfig,
  rateLimitProfiles,
  type RateLimitResult,
} from "@/lib/rate-limit";
export {
  enforceRateLimit,
  getRateLimitKey,
  getUserRateLimitKey,
} from "@/lib/rate-limit-middleware";
