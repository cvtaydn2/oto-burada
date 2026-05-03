import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { logger } from "@/lib/logging/logger";

type RatelimitState = Ratelimit | "MISSING_CONFIG" | "CONNECTION_ERROR" | null;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface LocalRateLimitEntry {
  count: number;
  reset: number;
}

const DEFAULT_LIMIT = 300; // 300 req/min (RSC requests skipped in middleware)
const DEFAULT_WINDOW_MS = 60_000;
const REDIS_CIRCUIT_BREAKER_MS = 30_000;
const MAX_LOCAL_ENTRIES = 10_000;
// Evict a batch of the oldest-looking entries when the cap is hit.
// Full-scan eviction on every 1000 calls is O(n) and causes CPU spikes.
// Instead we evict on size breach using a probabilistic batch delete.
const EVICT_BATCH_SIZE = 500;

const localFallbackStore = new Map<string, LocalRateLimitEntry>();
let lastCleanup = 0;
const CLEANUP_INTERVAL_MS = 30_000; // 30 seconds

function evictIfNeeded() {
  const now = Date.now();

  // 1. Throttle full scans to protect CPU
  if (now - lastCleanup < CLEANUP_INTERVAL_MS && localFallbackStore.size < MAX_LOCAL_ENTRIES) {
    return;
  }
  lastCleanup = now;

  let deleted = 0;

  // 2. Mandatory cleanup of expired entries
  for (const [key, entry] of localFallbackStore) {
    if (entry.reset <= now) {
      localFallbackStore.delete(key);
      deleted++;
    }
    // Limit scan per call to avoid blocking
    if (deleted >= EVICT_BATCH_SIZE) break;
  }

  // 3. Hard cap eviction if still over capacity
  if (localFallbackStore.size >= MAX_LOCAL_ENTRIES) {
    // Probabilistic eviction: randomly delete a batch of entries
    // This is much cheaper than a full scan or sorted eviction in serverless environments.
    let count = 0;
    const toDelete = EVICT_BATCH_SIZE;

    for (const [key] of localFallbackStore) {
      if (Math.random() < 0.2) {
        localFallbackStore.delete(key);
        count++;
      }
      if (count >= toDelete) break;
    }
    deleted += count;
  }

  if (deleted > 0) {
    logger.api.debug(`Rate limit local storage evicted ${deleted} entries`, {
      currentSize: localFallbackStore.size,
    });
  }
}

function getLocalFallbackResult(key: string, options: { limit?: number; windowMs?: number } = {}) {
  evictIfNeeded();

  const now = Date.now();
  const limit = options.limit ?? DEFAULT_LIMIT;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const existing = localFallbackStore.get(key);

  if (!existing || existing.reset <= now) {
    const reset = now + windowMs;
    localFallbackStore.set(key, { count: 1, reset });
    return { success: true, limit, remaining: limit - 1, reset };
  }

  existing.count += 1;

  return {
    success: existing.count <= limit,
    limit,
    remaining: Math.max(0, limit - existing.count),
    reset: existing.reset,
  };
}

let ratelimit: RatelimitState = null;
let redisCircuitOpenUntil = 0;
let redisClient: Redis | null = null;

function openRedisCircuit(reason: string, error?: unknown) {
  redisCircuitOpenUntil = Date.now() + REDIS_CIRCUIT_BREAKER_MS;
  logger.api.warn(reason, { redisCircuitOpenUntil }, error);
}

function getRedisClientSingleton(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    redisClient = Redis.fromEnv();
    return redisClient;
  } catch (error) {
    logger.security.error("Failed to initialize Redis client", error);
    return null;
  }
}

function getRatelimit() {
  if (ratelimit) return ratelimit;

  const isProduction = process.env.NODE_ENV === "production";

  const redisClientInstance = getRedisClientSingleton();

  if (!redisClientInstance) {
    if (isProduction) {
      logger.security.warn(
        "Upstash Redis config missing in production. Using in-memory fallback for rate limiting."
      );
      return "MISSING_CONFIG";
    }
    return null;
  }

  try {
    ratelimit = new Ratelimit({
      redis: redisClientInstance,
      limiter: Ratelimit.slidingWindow(300, "60 s"), // 300 req/min per IP (RSC skipped in middleware)
      analytics: true,
      prefix: "@upstash/ratelimit/oto-burada",
    });
    return ratelimit;
  } catch (error) {
    logger.security.error("Failed to initialize Upstash Ratelimit", error);
    ratelimit = isProduction ? "CONNECTION_ERROR" : null;
    return ratelimit;
  }
}

/**
 * Checks if a request is allowed based on a given key (IP, user ID, etc).
 */
export async function checkGlobalRateLimit(
  key: string,
  options: { limit?: number; windowMs?: number } = {}
) {
  if (redisCircuitOpenUntil > Date.now()) {
    return getLocalFallbackResult(key, options);
  }

  const limiter = getRatelimit();
  const isProduction = process.env.NODE_ENV === "production";

  if (limiter === "MISSING_CONFIG" || limiter === "CONNECTION_ERROR") {
    if (isProduction) {
      // ── SECURITY FIX: Issue SEC-RATE-01 - Fail-Closed for Critical Endpoints ──
      // When Redis is unavailable, fail CLOSED for critical endpoints to prevent
      // brute-force attacks and abuse. Fail OPEN for non-critical reads with monitoring.
      const isCriticalEndpoint =
        key.startsWith("auth:") ||
        key.startsWith("api:payments") ||
        key.startsWith("api:admin") ||
        key.startsWith("api:cron") ||
        key.includes(":update") ||
        key.includes(":create") ||
        key.includes(":delete");

      if (isCriticalEndpoint) {
        logger.security.error("Rate limiter unavailable - FAILING CLOSED for critical endpoint", {
          key,
          limiter,
          fallbackType: "fail_closed",
        });
        // Block request - return rate limited response
        return {
          success: false,
          limit: 0,
          remaining: 0,
          reset: Date.now() + 60_000, // 1 minute cooldown
        };
      }

      // Non-critical endpoints: fail OPEN with elevated monitoring
      logger.security.warn(
        "Redis rate limiter unavailable - failing OPEN with elevated monitoring",
        {
          limiter,
          key,
          fallbackType: "local_memory",
        }
      );
      return getLocalFallbackResult(key, options);
    }
    openRedisCircuit("Distributed rate limiter unavailable - using local fallback", {
      limiter,
    });
    return getLocalFallbackResult(key, options);
  }

  if (!limiter) {
    // ── LOGIC FIX: Issue LOGIC-01 - Pass windowMs to Dev Fallback ─────────────
    // In development with missing config, we still want to test the logic
    // but with much higher limits to avoid blocking workflow.
    // IMPORTANT: Pass windowMs to maintain consistent behavior with production.
    const devOptions = {
      limit: options.limit ? options.limit * 10 : 1000,
      windowMs: options.windowMs ?? 60_000,
    };
    return getLocalFallbackResult(key, devOptions);
  }

  try {
    const { success, limit, remaining, reset } = await limiter.limit(key);
    return { success, limit, remaining, reset };
  } catch (error) {
    if (isProduction) {
      // ── SECURITY FIX: Issue SEC-RATE-01 - Fail-Closed on Redis Errors ──
      // Same logic as MISSING_CONFIG: fail closed for critical endpoints
      const isCriticalEndpoint =
        key.startsWith("auth:") ||
        key.startsWith("api:payments") ||
        key.startsWith("api:admin") ||
        key.startsWith("api:cron");

      if (isCriticalEndpoint) {
        logger.security.error("Redis rate limit error - FAILING CLOSED for critical endpoint", {
          error: error instanceof Error ? error.message : String(error),
          key,
          fallbackType: "fail_closed",
        });
        return {
          success: false,
          limit: 0,
          remaining: 0,
          reset: Date.now() + 60_000,
        };
      }

      logger.security.error("Redis rate limit error - failing OPEN with monitoring", {
        error: error instanceof Error ? error.message : String(error),
        key,
      });
      return getLocalFallbackResult(key, options);
    }
    openRedisCircuit("Distributed Rate Limit Error - using local fallback", error);
    return getLocalFallbackResult(key, options);
  }
}

/**
 * Specialized brute-force protection for sensitive endpoints.
 * Prevents volumetric attacks by tracking specific identifiers (IP, Email, UserID).
 *
 * @param mode 'check' only verifies if the user is already blocked. 'increment' records a failure.
 */
export async function checkBruteForceLimit(
  identifier: string,
  type:
    | "login"
    | "register"
    | "forgot-password"
    | "password-reset"
    | "2fa"
    | "resend-verification" = "login",
  options: {
    limit?: number;
    windowMs?: number;
    userId?: string;
    mode?: "check" | "increment";
  } = {}
) {
  const mode = options.mode ?? "increment";

  // Standardized format: bruteforce:TYPE:ip:IDENTIFIER[:user:USERID]
  let key = `bruteforce:${type}:ip:${identifier}`;
  if (options.userId) {
    key = `${key}:user:${options.userId}`;
  }

  // If mode is 'check', we want to see if they are already over the limit without incrementing.
  // Upstash Ratelimit doesn't have a perfect 'peek' that returns everything,
  // so we use a very high limit with a short window for 'check' OR we check the raw Redis value.
  if (mode === "check") {
    const isProd = process.env.NODE_ENV === "production";
    const client = getRedisClientSingleton();

    if (!client) {
      logger.security.warn("Redis client unavailable in check mode", { key });
      return isProd
        ? { success: false, limit: 0, remaining: 0, reset: Date.now() + 60_000 }
        : { success: true, limit: 1, remaining: 1, reset: Date.now() };
    }

    try {
      // We check if the ZSET for this key has more than 'limit' entries.
      // prefix is added by the Ratelimit constructor, but we need to match it here.
      const fullKey = `@upstash/ratelimit/oto-burada:${key}`;
      const count = await client.zcount(
        fullKey,
        Date.now() - (options.windowMs ?? 15 * 60 * 1000),
        "+inf"
      );

      const limit = options.limit ?? 5;
      if (count >= limit) {
        return { success: false, limit, remaining: 0, reset: Date.now() + 60_000 };
      }
      return { success: true, limit, remaining: limit - count, reset: Date.now() };
    } catch (error) {
      if (isProd) {
        logger.security.error("Brute-force check error - FAILING CLOSED", { error, key });
        return { success: false, limit: 0, remaining: 0, reset: Date.now() + 60_000 };
      }
      return { success: true, limit: 1, remaining: 1, reset: Date.now() };
    }
  }

  // mode === 'increment'
  return await checkGlobalRateLimit(key, {
    limit: options.limit ?? 5,
    windowMs: options.windowMs ?? 15 * 60 * 1000,
  });
}
