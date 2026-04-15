import { Redis } from "@upstash/redis";
import { logger } from "@/lib/utils/logger";

const getRedisConfig = () => {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    };
  }
  return null;
};

const redisConfig = getRedisConfig();

export const redis = redisConfig ? new Redis(redisConfig) : null;

export async function getCachedData<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return data as T;
  } catch (error) {
    logger.db.warn("Redis getCachedData failed", { key }, error);
    return null;
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
