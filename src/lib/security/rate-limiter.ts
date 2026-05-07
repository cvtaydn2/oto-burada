/**
 * Rate limiter adapter / alias for backwards compatibility.
 * Re-exports from @/lib/rate-limiting/rate-limit and rate-limit-middleware.
 */

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
