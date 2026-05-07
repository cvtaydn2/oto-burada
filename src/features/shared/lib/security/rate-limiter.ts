/**
 * Rate limiter adapter / alias for backwards compatibility.
 * Re-exports from @/features/shared/lib/rate-limit and rate-limit-middleware.
 */

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
