import Redis from "ioredis";

const getRedisUrl = () => {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  if (process.env.UPSTASH_REDIS_REST_URL) return process.env.UPSTASH_REDIS_REST_URL; // Fallback
  
  const host = process.env.REDIS_HOST;
  const port = process.env.REDIS_PORT || "6379";
  const password = process.env.REDIS_PASSWORD;
  const user = process.env.REDIS_USER || "default";

  if (host) {
    return `redis://${user}:${password}@${host}:${port}`;
  }

  return null;
};

const redisUrl = getRedisUrl();

// Initialize Redis only if redisUrl is present
export const redis = redisUrl ? new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
}) : null;

if (redis) {
  redis.on("error", (err) => {
    // Only log once to avoid log spam, or use a logger
    console.error("Redis Connection Error");
  });
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    return null;
  }
}

export async function setCachedData(key: string, data: any, ttlSeconds: number = 3600) {
  if (!redis) return;
  try {
    const stringified = JSON.stringify(data);
    await redis.set(key, stringified, "EX", ttlSeconds);
  } catch (error) {
    // Silent fail
  }
}

export async function invalidateCache(key: string) {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (error) {
    // Silent fail
  }
}

export default redis;
