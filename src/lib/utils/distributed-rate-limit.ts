import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter, that allows 60 requests per 1 minute
// We use a shared Redis instance for all edge functions
export const globalRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/oto-burada",
});

/**
 * Checks if a request is allowed based on the user's IP address.
 * Optimized for Edge Middleware.
 */
export async function checkGlobalRateLimit(ip: string) {
  // If no Redis config, pass through (Fail-safe)
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return { success: true, limit: 100, remaining: 100, reset: 0 };
  }

  try {
    const { success, limit, remaining, reset } = await globalRatelimit.limit(
      `edge_ratelimit_${ip}`
    );
    return { success, limit, remaining, reset };
  } catch (error) {
    console.error("Distributed Rate Limit Error:", error);
    return { success: true, limit: 100, remaining: 100, reset: 0 };
  }
}
