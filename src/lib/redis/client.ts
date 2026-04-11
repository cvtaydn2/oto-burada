import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Initialize Redis only if env vars are present to avoid build crashes
export const redis = (redisUrl && redisToken) 
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

export async function getCachedData<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    return await redis.get<T>(key);
  } catch (error) {
    console.error("Redis Get Error:", error);
    return null;
  }
}

export async function setCachedData(key: string, data: any, ttlSeconds: number = 3600) {
  if (!redis) return;
  try {
    await redis.set(key, data, { ex: ttlSeconds });
  } catch (error) {
    console.error("Redis Set Error:", error);
  }
}

export async function invalidateCache(key: string) {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (error) {
    console.error("Redis Delete Error:", error);
  }
}
