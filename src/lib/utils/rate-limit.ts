/**
 * Simple in-memory rate limiter for API routes.
 *
 * Uses a sliding window approach stored in a Map.  Because this runs in
 * a single server process it will reset on restart and will not work for
 * horizontally scaled deployments – but it is entirely sufficient for
 * the MVP and saves an external dependency.
 */

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

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { redis } from "@/lib/redis";

const inMemoryStore = new Map<string, RateLimitEntry>();

function cleanupInMemory() {
  const now = Date.now();
  for (const [key, entry] of inMemoryStore) {
    if (entry.resetAt <= now) {
      inMemoryStore.delete(key);
    }
  }
}

/**
 * Check whether a given key (IP, userId, etc.) exceeds the configured rate limit.
 * Priority: 
 * 1. Redis (Persistent, Fast, Distributed)
 * 2. Supabase RPC (Persistent, Reliable)
 * 3. In-memory (Ephemeral, Fallback)
 */
export async function checkRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const fullKey = `ratelimit:${key}`;

  // 1. Redis Tier (Highly optimized)
  if (redis) {
    try {
      const now = Date.now();
      const multi = redis.multi();
      multi.incr(fullKey);
      multi.pexpire(fullKey, config.windowMs);
      
      const results = await multi.exec();
      if (results && results[0] && results[0][1] !== null) {
        const count = results[0][1] as number;
        const ttl = await redis.pttl(fullKey);
        const resetAt = now + (ttl > 0 ? ttl : config.windowMs);
        
        return {
          allowed: count <= config.limit,
          limit: config.limit,
          remaining: Math.max(0, config.limit - count),
          resetAt,
        };
      }
    } catch (e) {
      console.warn("Redis rate limit error, falling back:", e);
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
      
      console.warn("Rate limit DB error, falling back to in-memory:", error);
    } catch (e) {
      console.warn("Rate limit DB exception, falling back to in-memory:", e);
    }
  }

  // Fallback to in-memory (Broken in serverless, but works in local dev)
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

  /** Admin moderate: 30 per minute per IP */
  adminModerate: { limit: 30, windowMs: 60 * 1000 } satisfies RateLimitConfig,

  /** General API: 60 per minute per IP */
  general: { limit: 60, windowMs: 60 * 1000 } satisfies RateLimitConfig,
} as const;
