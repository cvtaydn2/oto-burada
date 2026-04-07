/**
 * Input sanitization utilities.
 *
 * These helpers strip potentially dangerous characters from user-provided
 * text before it is persisted or rendered in metadata.  They are intentionally
 * lightweight – the goal is to neutralize the most common XSS vectors while
 * keeping the content readable.
 */

const HTML_ENTITY_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};

const HTML_ENTITY_REGEX = /[&<>"']/g;

/**
 * Encode the five basic HTML-significant characters so they render as text
 * rather than being interpreted as markup.
 */
export function escapeHtml(value: string) {
  return value.replace(HTML_ENTITY_REGEX, (char) => HTML_ENTITY_MAP[char] ?? char);
}

/**
 * Remove HTML / script tags while keeping the text content.
 * Preserves newlines so multiline descriptions stay readable.
 */
export function stripTags(value: string) {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

/**
 * Sanitize a user-provided string for safe storage and rendering.
 * Strips tags first, then escapes any remaining HTML-significant characters.
 */
export function sanitizeText(value: string) {
  return escapeHtml(stripTags(value));
}

/**
 * Sanitize a multiline description field.
 * Strips dangerous tags while preserving newlines, then escapes.
 */
export function sanitizeDescription(value: string) {
  return escapeHtml(stripTags(value));
}

/**
 * Sanitize a value for use in meta tags (title / description).
 * Strips all tags and collapses whitespace into single spaces.
 */
export function sanitizeForMeta(value: string) {
  return stripTags(value)
    .replace(/[\r\n]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
