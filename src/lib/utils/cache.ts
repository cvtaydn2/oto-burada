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

  /**
   * Get cached value if exists and not expired
   */
  get<T>(key: string): T | null {
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
   * Clean up expired entries (call periodically)
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

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    serverCache.cleanup();
  }, 5 * 60 * 1000);
}

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
  ttlSeconds: number,
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
