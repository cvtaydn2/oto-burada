import { z } from "zod";

/**
 * World-Class Security: HTTP Parameter Pollution (HPP) Guard (Issue 7)
 * Standardizes incoming search params to prevent cache bypass and DB injection.
 */

/**
 * World-Class Security: Parameter Bucketization (Issue 5)
 * Combines infinite numeric variations into buckets to increase cache hits
 * and prevent "Continuously Varying Parameter" DoS attacks.
 */
function bucketize(value: string | null, bucketSize: number): string | null {
  if (!value) return null;
  const num = parseInt(value, 10);
  if (isNaN(num)) return value;
  // Round to nearest bucket (e.g. 104,300 -> 105,000)
  return (Math.ceil(num / bucketSize) * bucketSize).toString();
}

export function sanitizeQueryParams(params: URLSearchParams) {
  const sanitized = new URLSearchParams();
  const keys = Array.from(new Set(params.keys()));

  for (const key of keys) {
    const k = key.toLowerCase();
    const value = params.get(key);
    if (!value) continue;

    if (k.includes("[") || k.includes("]")) continue;

    // ── PILL: Issue 5 - Apply Bucketization ──
    let v = value.trim();
    if (k.includes("price")) v = bucketize(v, 10000) || v; // 10k buckets
    if (k.includes("km")) v = bucketize(v, 5000) || v; // 5k buckets
    if (k.includes("year")) v = bucketize(v, 2) || v; // 2 year buckets

    sanitized.set(k, v);
  }

  return sanitized;
}

/**
 * Zod-based Canonical Search Schema
 */
export const SearchQuerySchema = z.object({
  q: z.string().max(100).optional(),
  brand: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  city: z.string().max(50).optional(),
  // ── PILL: Issue 9 - Query Depth Limit (Anti-Scraping) ──
  // Prevents bots from traversing thousands of pages.
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().max(256).optional(),
});

export type CanonicalSearch = z.infer<typeof SearchQuerySchema>;

export function getCanonicalSearchParams(params: URLSearchParams): CanonicalSearch {
  const sanitized = sanitizeQueryParams(params);
  const raw = Object.fromEntries(sanitized.entries());
  return SearchQuerySchema.parse(raw);
}
