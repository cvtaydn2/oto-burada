import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { logger } from "@/lib/logging/logger";

type RatelimitState = Ratelimit | "MISSING_CONFIG" | "CONNECTION_ERROR" | null;

interface LocalRateLimitEntry {
  count: number;
  reset: number;
}

const DEFAULT_LIMIT = 120;
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

function openRedisCircuit(reason: string, error?: unknown) {
  redisCircuitOpenUntil = Date.now() + REDIS_CIRCUIT_BREAKER_MS;
  logger.api.warn(reason, { redisCircuitOpenUntil }, error);
}

function getRatelimit() {
  if (ratelimit) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const isProduction = process.env.NODE_ENV === "production";

  if (!url || !token) {
    if (isProduction) {
      logger.security.error(
        "CRITICAL: Upstash Redis config missing in production. Rate limiting will FAIL CLOSED."
      );
      return "MISSING_CONFIG";
    }
    return null;
  }

  try {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(120, "60 s"),
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
      // ── CRITICAL FIX: Fail OPEN with monitoring instead of fail-closed
      // Blocking all traffic when Redis is down causes self-inflicted DoS.
      // We allow requests but log extensively for security monitoring.
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
      // ── CRITICAL FIX: Fail OPEN on Redis errors instead of blocking all traffic
      // Log the error for investigation but don't block legitimate users
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
