import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimit: Ratelimit | null = null;

function getRatelimit() {
  if (ratelimit) return ratelimit;
  
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(60, "60 s"),
    analytics: true,
    prefix: "@upstash/ratelimit/oto-burada",
  });
  
  return ratelimit;
}

/**
 * Checks if a request is allowed based on the user's IP address.
 * Optimized for Edge Middleware.
 */
export async function checkGlobalRateLimit(ip: string) {
  const limiter = getRatelimit();
  
  if (!limiter) {
    return { success: true, limit: 100, remaining: 100, reset: 0 };
  }

  try {
    const { success, limit, remaining, reset } = await limiter.limit(
      `edge_ratelimit_${ip}`
    );
    return { success, limit, remaining, reset };
  } catch (error) {
    console.error("Distributed Rate Limit Error:", error);
    return { success: true, limit: 100, remaining: 100, reset: 0 };
  }
}

