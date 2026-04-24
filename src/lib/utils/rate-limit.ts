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

import { redis } from "@/lib/redis";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { logger } from "@/lib/utils/logger";

const inMemoryStore = new Map<string, RateLimitEntry>();

let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 dakika
const MAX_DELETIONS_PER_CLEANUP = 1000; // Event-loop bloklanmasını önlemek için limit

function cleanupInMemory() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  let deletedCount = 0;
  for (const [key, entry] of inMemoryStore) {
    if (entry.resetAt <= now) {
      inMemoryStore.delete(key);
      deletedCount++;
    }
    // Rate limit attack'lerinde bellekte milyonlarca key biriktiğinde
    // garbage collection veya the loop bloklanmasın diye:
    if (deletedCount >= MAX_DELETIONS_PER_CLEANUP) break;
  }
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
  let allTiersFailed = false;

  // 1. Redis Tier (Highly optimized)
  if (redis) {
    try {
      const now = Date.now();
      const count = await redis.incr(fullKey);
      await redis.expire(fullKey, Math.ceil(config.windowMs / 1000));

      const ttl = await redis.ttl(fullKey);
      const resetAt = now + (ttl > 0 ? ttl * 1000 : config.windowMs);

      return {
        allowed: count <= config.limit,
        limit: config.limit,
        remaining: Math.max(0, config.limit - count),
        resetAt,
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

  // All distributed tiers failed
  allTiersFailed = true;

  // SECURITY: Fail-closed in production for critical endpoints
  if (isProduction && config.failClosed) {
    logger.api.error("Rate limiting infrastructure unavailable - failing closed", {
      key,
      limit: config.limit,
      failClosed: true,
    });
    throw new Error("Rate limiting service unavailable");
  }

  // 3. Fallback to in-memory (Development or fail-open mode)
  if (allTiersFailed && isProduction) {
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
  listingBump: { limit: 3, windowMs: 24 * 60 * 60 * 1000 } satisfies RateLimitConfig,
};
