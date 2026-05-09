import { logger } from "@/lib/logger";

interface FallbackRateLimitEntry {
  timestamps: number[];
  expiresAt: number;
}

export interface FallbackRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const CLEANUP_INTERVAL_MS = 60_000;
const MAX_FALLBACK_ENTRIES = 10_000;
const fallbackStore = new Map<string, FallbackRateLimitEntry>();

let lastCleanupAt = 0;

function cleanupExpiredEntries(now: number) {
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS && fallbackStore.size < MAX_FALLBACK_ENTRIES) {
    return;
  }

  lastCleanupAt = now;

  for (const [key, entry] of fallbackStore) {
    if (entry.expiresAt <= now || entry.timestamps.length === 0) {
      fallbackStore.delete(key);
    }
  }

  if (fallbackStore.size <= MAX_FALLBACK_ENTRIES) {
    return;
  }

  const overflow = fallbackStore.size - MAX_FALLBACK_ENTRIES;
  const keysToEvict = Array.from(fallbackStore.keys()).slice(0, overflow);

  for (const key of keysToEvict) {
    fallbackStore.delete(key);
  }

  logger.api.warn("Fallback rate limit store exceeded capacity. Evicted oldest entries.", {
    evicted: overflow,
    size: fallbackStore.size,
  });
}

export function checkFallbackRateLimit(
  key: string,
  limit: number,
  windowMs: number
): FallbackRateLimitResult {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const windowStart = now - windowMs;
  const existing = fallbackStore.get(key);
  const timestamps = existing?.timestamps.filter((timestamp) => timestamp > windowStart) ?? [];

  if (timestamps.length >= limit) {
    const resetAt = timestamps[0] + windowMs;
    fallbackStore.set(key, {
      timestamps,
      expiresAt: resetAt,
    });

    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  timestamps.push(now);
  const resetAt = timestamps[0] + windowMs;

  fallbackStore.set(key, {
    timestamps,
    expiresAt: resetAt,
  });

  return {
    allowed: true,
    remaining: Math.max(0, limit - timestamps.length),
    resetAt,
  };
}

export function resetFallbackRateLimitStore() {
  fallbackStore.clear();
  lastCleanupAt = 0;
}
