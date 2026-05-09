/**
 * Smart, multi-tiered rate limiter for API routes.
 *
 * Supports three layers of enforcement:
 * 1. Redis Tier: Distributed, fast, and primary for production.
 * 2. Supabase RPC Tier: Persistent fallback if Redis is unavailable.
 * 3. In-memory Tier: Local fallback for development or total service outage.
 *
 * SECURITY: In production, critical endpoints should continue enforcing a
 * local fallback limit when distributed infrastructure is unavailable.
 * Fail-closed is reserved only for catastrophic cases where even fallback
 * execution cannot complete safely.
 */

export interface RateLimitConfig {
  /** Maximum requests allowed in the window. */
  limit: number;
  /** Window size in milliseconds. */
  windowMs: number;
  /**
   * If true, block requests only when every rate limiting tier, including
   * the local fallback, is unavailable.
   * Recommended for critical endpoints in production (auth, payments, admin).
   * Default: false
   */
  failClosed?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

import { createSupabaseAdminClient } from "@/lib/admin";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { checkFallbackRateLimit } from "@/lib/rate-limiting/fallback";
import { redis } from "@/lib/redis/client";

/**
 * Check whether a given key (IP, userId, etc.) exceeds the configured rate limit.
 * Priority:
 * 1. Redis (Persistent, Fast, Distributed)
 * 2. Supabase RPC (Persistent, Reliable)
 * 3. In-memory (Ephemeral, Fallback)
 *
 * SECURITY: If fallback execution itself fails and failClosed=true in production,
 * this function throws instead of allowing the request.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const fullKey = `ratelimit:${key}`;
  const isProduction = process.env.NODE_ENV === "production";

  // 1. Redis Tier (Atomic sliding window with Lua script)
  if (redis) {
    try {
      const now = Date.now();

      // Atomic sliding window using Lua script
      // This prevents race conditions between INCR and EXPIRE
      // ── PERFORMANCE FIX: Issue PERF-05 - Redis TTL Memory Leak Prevention ─────
      // TTL should be 2x window to ensure old entries are cleaned up even if
      // requests stop coming. This prevents memory leaks in Redis.
      const luaScript = `
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])
        local limit = tonumber(ARGV[3])
        local windowStart = now - window
        
        -- Remove old entries outside the window
        redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)
        
        -- Count current entries in window precisely
        local count = redis.call('ZCOUNT', key, windowStart, '+inf')
        
        if count < limit then
          -- Add new entry with current timestamp as score
          redis.call('ZADD', key, now, now)
          -- Set TTL to 2x window to prevent memory leaks
          redis.call('EXPIRE', key, math.ceil(window / 500))
          return {1, limit - count - 1, now + window}
        else
          -- Get oldest entry to calculate reset time
          local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
          local resetAt = tonumber(oldest[2]) + window
          -- Refresh TTL even on rate limit to ensure cleanup
          redis.call('EXPIRE', key, math.ceil(window / 500))
          return {0, 0, resetAt}
        end
      `;

      // Execute Lua script atomically
      const result = (await redis.eval(
        luaScript,
        [fullKey],
        [now.toString(), config.windowMs.toString(), config.limit.toString()]
      )) as [number, number, number];

      const [allowed, remaining, resetAt] = result;

      return {
        allowed: allowed === 1,
        limit: config.limit,
        remaining: Math.max(0, remaining),
        resetAt: Math.floor(resetAt),
      };
    } catch (e) {
      logger.api.warn("Redis rate limit error, falling back", { key: fullKey }, e);
    }
  }

  // 2. Supabase Tier
  if (hasSupabaseAdminEnv()) {
    try {
      const admin = createSupabaseAdminClient();
      const { data, error } = await admin.rpc("check_api_rate_limit", {
        p_key: key,
        p_limit: config.limit,
        p_window_ms: config.windowMs,
      });

      if (!error && data) {
        return data as unknown as RateLimitResult;
      }

      logger.api.warn("Rate limit DB error, falling back to in-memory", { key }, error);
    } catch (e) {
      logger.api.warn("Rate limit DB exception, falling back to in-memory", { key }, e);
    }
  }

  // All distributed tiers failed or were skipped.
  // 3. Fallback to in-memory so basic protection continues even during Redis outages.
  try {
    if (isProduction) {
      logger.api.warn("Rate limiting infrastructure unavailable - using in-memory fallback", {
        key,
        limit: config.limit,
        failClosed: config.failClosed ?? false,
      });
    }

    const fallbackResult = checkFallbackRateLimit(key, config.limit, config.windowMs);

    return {
      allowed: fallbackResult.allowed,
      limit: config.limit,
      remaining: fallbackResult.remaining,
      resetAt: fallbackResult.resetAt,
    };
  } catch (error) {
    if (config.failClosed && isProduction) {
      logger.api.error(
        "Rate limiting infrastructure unavailable - fallback failed, failing closed",
        {
          key,
          limit: config.limit,
          failClosed: true,
          error: error instanceof Error ? error.message : String(error),
        }
      );
      throw new Error(`[FAIL-CLOSED] Rate limiting service unavailable for key: ${fullKey}`);
    }

    logger.api.warn("Rate limiting fallback failed - allowing request", {
      key,
      limit: config.limit,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit,
      resetAt: Date.now() + config.windowMs,
    };
  }
}

/**
 * Pre-configured rate limit profiles for different endpoint categories.
 *
 * SECURITY NOTE: Critical endpoints (auth, payments, admin) use failClosed=true
 * to block requests if rate limiting infrastructure is unavailable in production.
 */
export const rateLimitProfiles = {
  /** Auth attempts: 10 per 15 minutes per IP - FAIL-CLOSED */
  auth: { limit: 10, windowMs: 15 * 60 * 1000, failClosed: true } satisfies RateLimitConfig,

  /** Forgot password: 3 per hour per email - FAIL-CLOSED (prevent enumeration) */
  forgotPassword: {
    limit: 3,
    windowMs: 60 * 60 * 1000,
    failClosed: true,
  } satisfies RateLimitConfig,

  /** Auth failures: 5 failures per 15 minutes per IP - FAIL-CLOSED (brute-force protection) */
  authFailure: { limit: 5, windowMs: 15 * 60 * 1000, failClosed: true } satisfies RateLimitConfig,

  /** Listing creation: 10 per hour per user - FAIL-CLOSED (prevent spam) */
  listingCreate: {
    limit: 10,
    windowMs: 60 * 60 * 1000,
    failClosed: true,
  } satisfies RateLimitConfig,

  /** Image upload: 30 per hour per user */
  imageUpload: { limit: 30, windowMs: 60 * 60 * 1000 } satisfies RateLimitConfig,

  /** Report creation: 5 per hour per user */
  reportCreate: { limit: 5, windowMs: 60 * 60 * 1000 } satisfies RateLimitConfig,

  /** Admin moderate: 30 per minute per IP - FAIL-CLOSED */
  adminModerate: { limit: 30, windowMs: 60 * 1000, failClosed: true } satisfies RateLimitConfig,

  /** General API: 60 per minute per IP - FAIL-CLOSED (prevent scraping) */
  general: { limit: 60, windowMs: 60 * 1000, failClosed: true } satisfies RateLimitConfig,

  /** Doping apply: 5 per hour per user - FAIL-CLOSED (prevent abuse) */
  dopingApply: { limit: 5, windowMs: 60 * 60 * 1000, failClosed: true } satisfies RateLimitConfig,

  /** Support ticket creation: 5 per hour per user */
  ticketCreate: { limit: 5, windowMs: 60 * 60 * 1000 } satisfies RateLimitConfig,

  /** Public contact form: 3 per hour per IP - FAIL-CLOSED (spam prevention) */
  contactCreate: { limit: 3, windowMs: 60 * 60 * 1000, failClosed: true } satisfies RateLimitConfig,

  /** Listing bump: 3 per day per user */
  listingBump: {
    limit: 3,
    windowMs: 24 * 60 * 60 * 1000,
    failClosed: true,
  } satisfies RateLimitConfig,
};
