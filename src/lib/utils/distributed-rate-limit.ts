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
const localFallbackStore = new Map<string, LocalRateLimitEntry>();
let ratelimit: RatelimitState = null;
let redisCircuitOpenUntil = 0;
let callCount = 0;

function evictExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of localFallbackStore) {
    if (entry.reset <= now) {
      localFallbackStore.delete(key);
    }
  }
}

function getLocalFallbackResult(key: string, options: { limit?: number; windowMs?: number } = {}) {
  callCount++;
  if (callCount >= 1000) {
    evictExpiredEntries();
    callCount = 0;
  }

  if (localFallbackStore.size > MAX_LOCAL_ENTRIES) {
    evictExpiredEntries();
  }

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
    return {
      success: true,
      limit: options.limit ?? 100,
      remaining: options.limit ?? 100,
      reset: 0,
    };
  }

  try {
    const { success, limit, remaining, reset } = await limiter.limit(key);
    return { success, limit, remaining, reset };
  } catch (error) {
    openRedisCircuit("Distributed Rate Limit Error - using local fallback", error);
    return getLocalFallbackResult(key, options);
  }
}
