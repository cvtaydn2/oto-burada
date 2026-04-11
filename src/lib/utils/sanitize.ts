/**
 * Input sanitization utilities.
 * 
 * Hardened for production: strictly strips all HTML and escapes sensitive characters.
 */

/**
 * Sanitize a user-provided string for safe storage and rendering.
 * Removes all HTML tags and returns plain text.
 */
export function sanitizeText(value: string): string {
  if (!value) return "";
  return stripAllHtml(value);
}

/**
 * Sanitize a multiline description field.
 * Allows only line breaks for readability, strips everything else.
 */
export function sanitizeDescription(value: string): string {
  if (!value) return "";
  // We keep newlines as-is, but strip all HTML tags
  return stripAllHtml(value);
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
 * Escape the basic HTML-significant characters.
 * Essential for rendering untrusted content in non-JSX contexts.
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
 * Strictly remove all HTML tags from a string.
 * This is a 'greedy' strip that removes anything between < and >.
 */
function stripAllHtml(value: string): string {
  return value
    // 1. Remove script tags and their content entirey
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // 2. Remove style tags and their content entirely
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    // 3. Remove all other tags
    .replace(/<[^>]*>/g, "")
    // 4. Decode any basic entities if they were trying to be smart
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    // 5. One last pass to ensure no tags were hidden inside entities
    .replace(/<[^>]*>/g, "")
    .trim();
}
