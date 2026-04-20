import { z } from "zod";

/**
 * World-Class Security: HTTP Parameter Pollution (HPP) Guard (Issue 7)
 * Standardizes incoming search params to prevent cache bypass and DB injection.
 */

export function sanitizeQueryParams(params: URLSearchParams) {
  const sanitized = new URLSearchParams();
  
  // Only keep known, single-value parameters
  // Example: ?q=araba&q=kamyon -> ?q=araba
  const keys = Array.from(new Set(params.keys()));
  
  for (const key of keys) {
    const value = params.get(key);
    if (!value) continue;

    // Canonicalize key names (lowercase) and trim values
    const k = key.toLowerCase();
    const v = value.trim();

    // Prevent Array-style poison (?q[]=...)
    if (k.includes('[') || k.includes(']')) continue;
    
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
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  // ── PILL: Issue 6 - Cursor DoS Protection ──
  // Limit cursor length to prevent memory/CPU exhaustion during parsing.
  cursor: z.string().max(256).optional(),
});

export type CanonicalSearch = z.infer<typeof SearchQuerySchema>;

export function getCanonicalSearchParams(params: URLSearchParams): CanonicalSearch {
  const sanitized = sanitizeQueryParams(params);
  const raw = Object.fromEntries(sanitized.entries());
  return SearchQuerySchema.parse(raw);
}
