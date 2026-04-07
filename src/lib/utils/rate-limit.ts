/**
 * Simple in-memory rate limiter for API routes.
 *
 * Uses a sliding window approach stored in a Map.  Because this runs in
 * a single server process it will reset on restart and will not work for
 * horizontally scaled deployments – but it is entirely sufficient for
 * the MVP and saves an external dependency.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();

  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }

  lastCleanup = now;

  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Maximum requests allowed in the window. */
  limit: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Check whether a given key (IP, userId, etc.) exceeds the configured rate limit.
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  cleanup();

  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, limit: config.limit, remaining: config.limit - 1, resetAt };
  }

  existing.count += 1;

  if (existing.count > config.limit) {
    return {
      allowed: false,
      limit: config.limit,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  return {
    allowed: true,
    limit: config.limit,
    remaining: config.limit - existing.count,
    resetAt: existing.resetAt,
  };
}

/**
 * Pre-configured rate limit profiles for different endpoint categories.
 */
export const rateLimitProfiles = {
  /** Auth attempts: 10 per 15 minutes per IP */
  auth: { limit: 10, windowMs: 15 * 60 * 1000 } satisfies RateLimitConfig,

  /** Listing creation: 10 per hour per user */
  listingCreate: { limit: 10, windowMs: 60 * 60 * 1000 } satisfies RateLimitConfig,

  /** Image upload: 30 per hour per user */
  imageUpload: { limit: 30, windowMs: 60 * 60 * 1000 } satisfies RateLimitConfig,

  /** Report creation: 5 per hour per user */
  reportCreate: { limit: 5, windowMs: 60 * 60 * 1000 } satisfies RateLimitConfig,

  /** General API: 60 per minute per IP */
  general: { limit: 60, windowMs: 60 * 1000 } satisfies RateLimitConfig,
} as const;
