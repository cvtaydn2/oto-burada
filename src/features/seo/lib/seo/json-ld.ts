/**
 * Sanitizes JSON for embedding in <script type="application/ld+json">.
 * Prevents XSS by escaping dangerous characters like <, >, &.
 */
export function safeJsonLd(data: unknown): string {
  const json = JSON.stringify(data);

  // Escape HTML-sensitive characters to prevent script injection.
  // Specifically </script> is dangerous.
  // \u003c is <
  // \u003e is >
  // \u0026 is &
  return json.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

/**
 * Alias for safeJsonLd
 */
export const sanitizeJsonLd = safeJsonLd;
