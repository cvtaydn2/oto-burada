import Redis from "ioredis"

const redisHost = process.env.REDIS_HOST
const redisPort = process.env.REDIS_PORT
const redisPassword = process.env.REDIS_PASSWORD
const redisUser = process.env.REDIS_USER || "default"

/**
 * Singleton Redis client for standard (TCP) connections.
 * Use this for Node.js runtime (API routes, Server Actions).
 * For Edge Runtime, use Upstash REST client instead.
 */
function createRedisClient() {
  if (!redisHost) {
    console.warn("REDIS_HOST is not set. Redis features will be disabled.")
    return null
  }

  try {
    const client = new Redis({
      host: redisHost,
      port: Number(redisPort) || 6379,
      password: redisPassword,
      username: redisUser,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      maxRetriesPerRequest: 3,
    })

    client.on("error", (err) => {
      console.error("Redis Client Error:", err)
    })

    return client
  } catch (error) {
    console.error("Failed to initialize Redis client:", error)
    return null
  }
}

// Global variable to prevent multiple instances in development (HMR)
const globalForRedis = global as unknown as { redis: Redis | null }

export const redis = globalForRedis.redis || createRedisClient()

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis
}

export default redis
