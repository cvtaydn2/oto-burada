/**
 * Smart, multi-tiered rate limiter for API routes.
 *
 * Supports three layers of enforcement:
 * 1. Redis Tier: Distributed, fast, and primary for production.
 * 2. Supabase RPC Tier: Persistent fallback if Redis is unavailable.
 * 3. In-memory Tier: Local fallback for development or total service outage.
 *
 * SECURITY: In production, if all tiers fail for critical endpoints,
 * the limiter can be configured to fail-closed (block requests).
 */

export interface RateLimitConfig {
  /** Maximum requests allowed in the window. */
  limit: number;
  /** Window size in milliseconds. */
  windowMs: number;
  /**
   * If true, block requests when rate limiting infrastructure is unavailable (fail-closed).
   * Recommended for critical endpoints in production (auth, payments, admin).
   * Default: false (fail-open for backward compatibility)
   */
  failClosed?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

import { logger } from "@/lib/logging/logger";
import { redis } from "@/lib/redis";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

const inMemoryStore = new Map<string, RateLimitEntry>();

let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute
const MAX_DELETIONS_PER_CLEANUP = 1000; // Protect event loop
const MAX_SCAN_PER_CLEANUP = 500; // Max scan per tick
// ── PERFORMANCE FIX: Issue PERF-06 - Increase In-Memory Capacity ─────────────
// Increased from 10,000 to 50,000 to handle high-traffic endpoints better.
// Eviction is already optimized with setImmediate and batch processing.
const MAX_IN_MEMORY_ENTRIES = 50_000; // Prevent unbounded memory growth

/**
 * Clean up expired entries asynchronously to prevent event loop blocking.
 * Uses setImmediate to yield to other operations.
 *
 * PERFORMANCE: Prevents blocking the event loop on large stores.
 */
function cleanupInMemory() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  // ── ARCHITECTURE FIX: Issue #EDGE-01 - Edge Compatibility ─────
  // Schedule cleanup using setTimeout(..., 0) which is supported in both
  // Node.js and Edge Runtime. setImmediate is not available in Edge.
  setTimeout(() => {
    let scannedCount = 0;
    let deletedCount = 0;

    // Map iteration order is insertion order.
    for (const [key, entry] of inMemoryStore) {
      scannedCount++;
      if (entry.resetAt <= now) {
        inMemoryStore.delete(key);
        deletedCount++;
      }

      if (scannedCount >= MAX_SCAN_PER_CLEANUP || deletedCount >= MAX_DELETIONS_PER_CLEANUP) {
        break;
      }
    }

    // Hard cap enforcement: if still over capacity after cleanup, evict oldest entries
    if (inMemoryStore.size > MAX_IN_MEMORY_ENTRIES) {
      const toEvict = inMemoryStore.size - MAX_IN_MEMORY_ENTRIES;
      const keys = inMemoryStore.keys();
      for (let i = 0; i < toEvict; i++) {
        const next = keys.next();
        if (next.done) break;
        inMemoryStore.delete(next.value);
      }
      logger.api.warn(
        `In-memory rate limit store exceeded capacity. Evicted ${toEvict} oldest entries.`
      );
    }

    if (deletedCount > 0) {
      logger.api.debug(`In-memory rate limit cleanup: deleted ${deletedCount} expired entries.`);
    }
  }, 0);
}

/**
 * Check whether a given key (IP, userId, etc.) exceeds the configured rate limit.
 * Priority:
 * 1. Redis (Persistent, Fast, Distributed)
 * 2. Supabase RPC (Persistent, Reliable)
 * 3. In-memory (Ephemeral, Fallback) - only in development or if failClosed=false
 *
 * SECURITY: If failClosed=true and all infrastructure fails in production,
 * this function throws an error instead of allowing the request.
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
        return data as RateLimitResult;
      }

      logger.api.warn("Rate limit DB error, falling back to in-memory", { key }, error);
    } catch (e) {
      logger.api.warn("Rate limit DB exception, falling back to in-memory", { key }, e);
    }
  }

  // All distributed tiers failed or were skipped
  // 3. Fallback to in-memory (Development or fail-open mode)
  if (config.failClosed && isProduction) {
    logger.api.error("Rate limiting infrastructure unavailable - failing closed", {
      key,
      limit: config.limit,
      failClosed: true,
    });
    throw new Error(`[FAIL-CLOSED] Rate limiting service unavailable for key: ${fullKey}`);
  }

  if (isProduction) {
    logger.api.warn("Rate limiting infrastructure unavailable - using in-memory fallback", {
      key,
      limit: config.limit,
      failClosed: false,
    });
  }

  cleanupInMemory();
  const now = Date.now();
  const existing = inMemoryStore.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + config.windowMs;
    inMemoryStore.set(key, { count: 1, resetAt });
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
 *
 * SECURITY NOTE: Critical endpoints (auth, payments, admin) use failClosed=true
 * to block requests if rate limiting infrastructure is unavailable in production.
 */
export const rateLimitProfiles = {
  /** Auth attempts: 10 per 15 minutes per IP - FAIL-CLOSED */
  auth: { limit: 10, windowMs: 15 * 60 * 1000, failClosed: true } satisfies RateLimitConfig,

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
