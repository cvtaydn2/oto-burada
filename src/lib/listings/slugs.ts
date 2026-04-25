/**
 * URL and slug utilities
 */

/**
 * Normalize a URL slug to a readable format (e.g., "istanbul" -> "Istanbul")
 */
export function normalizeSlug(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();
}

/**
 * Convert a city or brand name to URL-friendly slug
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
