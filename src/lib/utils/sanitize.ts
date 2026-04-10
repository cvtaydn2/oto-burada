/**
 * Input sanitization utilities.
 *
 * Uses `isomorphic-dompurify` for robust HTML sanitization that works on both
 * server and client. Falls back to regex-based stripping if DOMPurify fails.
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize a user-provided string for safe storage and rendering.
 * Removes all HTML tags and returns plain text.
 */
export function sanitizeText(value: string): string {
  try {
    return DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    }).trim();
  } catch {
    return stripTagsFallback(value);
  }
}

/**
 * Sanitize a multiline description field.
 * Allows only line breaks for readability, strips everything else.
 */
export function sanitizeDescription(value: string): string {
  try {
    // First pass: strip all dangerous content
    const cleaned = DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
    // Preserve intentional newlines from the original text
    return cleaned.trim();
  } catch {
    return stripTagsFallback(value);
  }
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
