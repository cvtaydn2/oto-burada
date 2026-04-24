import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { logger } from "@/lib/utils/logger";

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

// Simple in-memory fallback for Edge/Middleware (per instance)
const localFallbackStore = new Map<string, { count: number; reset: number }>();

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
    const { success, limit, remaining, reset } = await limiter.limit(`edge_ratelimit_${ip}`);
    return { success, limit, remaining, reset };
  } catch (error) {
    logger.api.error("Distributed Rate Limit Error - using local fallback", error);

    // Local in-memory fallback (60 requests per minute)
    const now = Date.now();
    const windowMs = 60 * 1000;
    const entry = localFallbackStore.get(ip);

    if (!entry || entry.reset < now) {
      const newReset = now + windowMs;
      localFallbackStore.set(ip, { count: 1, reset: newReset });
      return { success: true, limit: 60, remaining: 59, reset: newReset };
    }

    entry.count += 1;
    const isAllowed = entry.count <= 60;

    return {
      success: isAllowed,
      limit: 60,
      remaining: Math.max(0, 60 - entry.count),
      reset: entry.reset,
    };
  }
}
