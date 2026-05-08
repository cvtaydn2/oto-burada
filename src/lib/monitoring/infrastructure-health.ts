/**
 * Infrastructure Health Checks
 *
 * Validates that required infrastructure (Redis, Supabase) is available
 * for critical production operations.
 */

import { hasSupabaseAdminEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { redis } from "@/lib/redis/client";

export interface HealthCheckResult {
  healthy: boolean;
  redis: boolean;
  supabase: boolean;
  timestamp: number;
}

/**
 * Check if rate limiting infrastructure is available.
 * Returns true if at least one tier (Redis or Supabase) is available.
 */
export async function checkRateLimitInfrastructure(): Promise<boolean> {
  // Redis check
  if (redis) {
    try {
      await redis.ping();
      return true;
    } catch (e) {
      logger.api.warn("Redis health check failed", {}, e);
    }
  }

  // Supabase check
  if (hasSupabaseAdminEnv()) {
    return true; // Supabase env available
  }

  return false;
}

/**
 * Comprehensive health check for all infrastructure components.
 * Use this for startup validation or health endpoints.
 */
export async function checkInfrastructureHealth(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    healthy: false,
    redis: false,
    supabase: false,
    timestamp: Date.now(),
  };

  // Check Redis
  if (redis) {
    try {
      await redis.ping();
      result.redis = true;
    } catch (e) {
      logger.api.warn("Redis health check failed", {}, e);
    }
  }

  // Check Supabase
  result.supabase = hasSupabaseAdminEnv();

  // Overall health: at least one component must be healthy
  result.healthy = result.redis || result.supabase;

  return result;
}

/**
 * Validate that critical infrastructure is available on startup.
 * Logs warnings if infrastructure is missing in production.
 *
 * Call this in middleware or API route initialization.
 */
export function validateProductionInfrastructure(): void {
  if (process.env.NODE_ENV !== "production") {
    return; // Skip in development
  }

  const hasRedis = !!redis;
  const hasSupabase = hasSupabaseAdminEnv();

  if (!hasRedis && !hasSupabase) {
    logger.api.error("CRITICAL: No rate limiting infrastructure available in production!", {
      redis: hasRedis,
      supabase: hasSupabase,
    });
  } else if (!hasRedis) {
    logger.api.warn("Redis unavailable in production - using Supabase fallback", {
      redis: false,
      supabase: hasSupabase,
    });
  } else if (!hasSupabase) {
    logger.api.warn("Supabase unavailable in production - using Redis only", {
      redis: hasRedis,
      supabase: false,
    });
  } else {
    logger.api.info("Rate limiting infrastructure healthy", {
      redis: hasRedis,
      supabase: hasSupabase,
    });
  }
}
