import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { logger } from "@/lib/utils/logger";

type RatelimitState = Ratelimit | "MISSING_CONFIG" | "CONNECTION_ERROR" | null;

interface LocalRateLimitEntry {
  count: number;
  reset: number;
}

const DEFAULT_LIMIT = 60;
const DEFAULT_WINDOW_MS = 60_000;
const REDIS_CIRCUIT_BREAKER_MS = 30_000;
const MAX_LOCAL_ENTRIES = 10_000;
// Evict a batch of the oldest-looking entries when the cap is hit.
// Full-scan eviction on every 1000 calls is O(n) and causes CPU spikes.
// Instead we evict on size breach using a probabilistic batch delete.
const EVICT_BATCH_SIZE = 500;

const localFallbackStore = new Map<string, LocalRateLimitEntry>();

function evictIfNeeded() {
  if (localFallbackStore.size < MAX_LOCAL_ENTRIES) return;

  const now = Date.now();
  let deleted = 0;

  // First pass: remove expired entries (cheap exit for most cases)
  for (const [key, entry] of localFallbackStore) {
    if (entry.reset <= now) {
      localFallbackStore.delete(key);
      deleted++;
      if (deleted >= EVICT_BATCH_SIZE) return;
    }
  }

  // Second pass: if still over cap, evict oldest by reset time (batch only)
  if (localFallbackStore.size >= MAX_LOCAL_ENTRIES) {
    const sorted = [...localFallbackStore.entries()].sort((a, b) => a[1].reset - b[1].reset);
    for (let i = 0; i < EVICT_BATCH_SIZE && i < sorted.length; i++) {
      localFallbackStore.delete(sorted[i][0]);
    }
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
      limiter: Ratelimit.slidingWindow(60, "60 s"),
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

  if (limiter === "MISSING_CONFIG" || limiter === "CONNECTION_ERROR") {
    openRedisCircuit("Distributed rate limiter unavailable - using local fallback", {
      limiter,
    });
    return getLocalFallbackResult(key, options);
  }

  if (!limiter) {
    // In development with missing config, we still want to test the logic
    // but with much higher limits to avoid blocking workflow.
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
    openRedisCircuit("Distributed Rate Limit Error - using local fallback", error);
    return getLocalFallbackResult(key, options);
  }
}
