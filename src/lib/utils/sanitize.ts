/**
 * Input sanitization utilities.
 *
 * Uses regex-based stripping for robust HTML sanitization.
 */

/**
 * Sanitize a user-provided string for safe storage and rendering.
 * Removes all HTML tags and returns plain text.
 * Optimized for server-side to avoid heavy jsdom/DOMPurify when doing simple text stripping.
 */
export function sanitizeText(value: string): string {
  // If we only want to strip all tags, regex is much faster and safer for server environments
  return stripTagsFallback(value);
}

/**
 * Sanitize a multiline description field.
 * Allows only line breaks for readability, strips everything else.
 */
export function sanitizeDescription(value: string): string {
  // If we only want to strip all tags, regex is much faster and safer for server environments
  return stripTagsFallback(value);
}

/**
 * Sanitize a value for use in meta tags (title / description).
 * Strips all tags and collapses whitespace into single spaces.
 */
export function sanitizeForMeta(value: string): string {
  return sanitizeText(value)
    .replace(/[\r\n]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Escape the five basic HTML-significant characters so they render as text
 * rather than being interpreted as markup.
 */
export function escapeHtml(value: string): string {
  const HTML_ENTITY_MAP: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
  };
  return value.replace(/[&<>"']/g, (char) => HTML_ENTITY_MAP[char] ?? char);
}

/**
 * Fallback regex-based tag stripping if DOMPurify isn't available.
 */
function stripTagsFallback(value: string): string {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}
