import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { logger } from "@/lib/utils/logger";

let ratelimit: Ratelimit | null = null;

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
    return isProduction ? "CONNECTION_ERROR" : null;
  }
}

/**
 * Checks if a request is allowed based on a given key (IP, user ID, etc).
 */
export async function checkGlobalRateLimit(
  key: string,
  options: { limit?: number; windowMs?: number } = {}
) {
  const limiter = getRatelimit();
  const isProduction = process.env.NODE_ENV === "production";

  if (limiter === "MISSING_CONFIG" || limiter === "CONNECTION_ERROR") {
    return { success: false, limit: 0, remaining: 0, reset: 0 };
  }

  if (!limiter) {
    return { success: true, limit: 100, remaining: 100, reset: 0 };
  }

  try {
    const { success, limit, remaining, reset } = await limiter.limit(key);
    return { success, limit, remaining, reset };
  } catch (error) {
    const isProduction = process.env.NODE_ENV === "production";
    logger.api.error("Distributed Rate Limit Error - applying fail-closed policy", error);

    if (isProduction) {
      // FAIL-CLOSED in production to protect infrastructure
      return { success: false, limit: 0, remaining: 0, reset: Date.now() + 60000 };
    }

    // Allow in development
    return { success: true, limit: 100, remaining: 100, reset: 0 };
  }
}
