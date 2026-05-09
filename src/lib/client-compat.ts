/**
 * Deprecated compatibility surface.
 *
 * Keep this file minimal and server-only in practice: legacy cache callers should
 * migrate to `@/lib/redis/client` directly instead of importing this bridge.
 */
export { getCachedData, invalidateCache, setCachedData } from "./redis/client";
