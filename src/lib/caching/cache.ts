/**
 * Simple in-memory cache for server-side data.
 *
 * PERFORMANCE OPTIMIZATION:
 * - Reduces expensive DB queries for frequently accessed data
 * - TTL-based expiration prevents stale data
 * - Memory-efficient: auto-cleanup on access
 *
 * Use cases:
 * - Market stats (updated hourly)
 * - Analytics aggregates (updated daily)
 * - Reference data (brands, cities)
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly MAX_ENTRIES = 2000;

  /**
   * Get cached value if exists and not expired
   */
  get<T>(key: string): T | null {
    // Probabilistic cleanup (1% of requests) to prevent stale entries leak in serverless
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached value with TTL in seconds
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    // ── PILL: Issue 3 - Memory Poisoning Prevention ──────────────────
    if (this.cache.size >= this.MAX_ENTRIES) {
      // Evict the oldest entry (Map maintains insertion order)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Delete cached value
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries (lazy cleanup during access or periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const serverCache = new MemoryCache();

/**
 * Helper to wrap expensive operations with caching
 *
 * @example
 * const stats = await withCache(
 *   "market-stats-bmw-320-2020",
 *   () => calculateMarketStats("BMW", "320", 2020),
 *   3600 // 1 hour TTL
 * );
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // Try cache first
  const cached = serverCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss: execute function
  const result = await fn();

  // Store in cache
  serverCache.set(key, result, ttlSeconds);

  return result;
}

import { unstable_cache } from "next/cache";

/**
 * Next.js ISR-aware cache wrapper.
 *
 * Uses `unstable_cache` in Next.js server runtime for ISR revalidation support.
 * Falls back to a plain function call in test environments or browser.
 *
 * PERFORMANCE: Static import prevents module resolution overhead on every call.
 *
 * @param keyParts  - Cache key segments (used by Next.js for invalidation)
 * @param loader    - Async function that fetches the data
 * @param revalidate - Revalidation interval in seconds (default: 60)
 */
export async function withNextCache<T>(
  keyParts: string[],
  loader: () => Promise<T>,
  revalidate = 60
): Promise<T> {
  // Skip caching in test/browser environments
  if (
    process.env.NODE_ENV === "test" ||
    typeof window !== "undefined" ||
    !process.env.NEXT_RUNTIME
  ) {
    return loader();
  }

  try {
    return unstable_cache(loader, keyParts, { revalidate })();
  } catch {
    // Fallback if unstable_cache fails
    return loader();
  }
}
