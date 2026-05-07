import { redis } from "@/features/shared/lib/client";
import { logger } from "@/features/shared/lib/logger";

/**
 * Hyper-Scale Resilience Patterns
 */

/**
 * 1. Simple Circuit Breaker Implementation
 * Prevents cascading failures when external services are down.
 */
export class CircuitBreaker {
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly threshold: number;
  private readonly timeout: number;

  constructor(threshold = 5, timeout = 30000) {
    this.threshold = threshold;
    this.timeout = timeout;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error("CircuitBreaker: Service is currently unavailable (OPEN)");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = "OPEN";
      logger.system.error("CircuitBreaker: Circuit opened due to multiple failures");
    }
  }

  getState() {
    return this.state;
  }
}

/**
 * 2. Redis Mutex (Mutual Exclusion) Lock
 * Prevents "Thundering Herd" problem by ensuring only one request
 * recomputes a heavy resource at a time.
 */
export async function withRedisLock<T>(
  lockKey: string,
  fn: () => Promise<T>,
  ttlSeconds = 5
): Promise<T | null> {
  if (!redis) {
    return await fn();
  }

  const fullKey = `lock:${lockKey}`;
  const requestId = crypto.randomUUID();

  // Try to acquire lock
  const acquired = await redis.set(fullKey, requestId, {
    ex: ttlSeconds,
    nx: true,
  });

  if (acquired) {
    try {
      return await fn();
    } finally {
      const currentVal = await redis.get(fullKey);
      if (currentVal === requestId) {
        await redis.del(fullKey);
      }
    }
  }
  return null;
}

export async function getCachedOrRevalidate<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttlSeconds = 60
): Promise<T> {
  if (!redis) return await fetchFn();

  const cached = await redis.get<T>(cacheKey);
  if (cached) return cached;

  const data = await fetchFn();
  await redis.set(cacheKey, data, { ex: ttlSeconds });
  return data;
}

// Global Circuit Breaker instances for shared services
export const iyzicoBreaker = new CircuitBreaker(5, 60000);
export const resendBreaker = new CircuitBreaker(3, 30000);
