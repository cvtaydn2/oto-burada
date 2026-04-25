import { Redis } from "@upstash/redis";

import { logger } from "@/lib/logging/logger";

const getRedisConfig = () => {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    };
  }

  // SECURITY: Warn if Redis is not configured in production
  if (process.env.NODE_ENV === "production") {
    logger.db.error(
      "CRITICAL: Redis (Upstash) is not configured for production! Rate limiting will be degraded."
    );
  }

  return null;
};

const redisConfig = getRedisConfig();

export const redis = redisConfig ? new Redis(redisConfig) : null;

export async function getCachedData<T>(key: string): Promise<T | null | undefined> {
  if (!redis) return undefined;
  try {
    const data = await redis.get(key);
    // ── PILL: Issue 2 - Negative Cache (Null Object Pattern) ──
    // If the data is specifically marked as missing in DB, return null.
    // If there is no entry at all, return undefined.
    if (data === "___MISSING___") return null;
    if (data === null || data === undefined) return undefined;
    return data as T;
  } catch (error) {
    logger.db.warn("Redis getCachedData failed", { key }, error);
    return undefined;
  }
}

/**
 * Marks a resource as "Not Found" in Redis to skip DB lookups for a while.
 */
export async function setNegativeCache(key: string, ttlSeconds: number = 300) {
  if (!redis) return;
  try {
    await redis.set(key, "___MISSING___", { ex: ttlSeconds });
  } catch (error) {
    logger.db.warn("Redis setNegativeCache failed", { key }, error);
  }
}

export async function setCachedData<T>(key: string, data: T, ttlSeconds: number = 3600) {
  if (!redis) return;
  try {
    await redis.set(key, data, { ex: ttlSeconds });
  } catch (error) {
    logger.db.warn("Redis setCachedData failed", { key }, error);
  }
}

export async function invalidateCache(key: string) {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (error) {
    logger.db.warn("Redis invalidateCache failed", { key }, error);
  }
}

export default redis;
