/**
 * Safely stringifies an object for use in a <script type="application/ld+json"> tag.
 * Escapes characters like <, >, and & to prevent XSS via </script> injection.
 */
export function safeJsonLd(data: Record<string, unknown>): string {
  if (!data) return "{}";

  const json = JSON.stringify(data);

  // Escape characters that could break out of a <script> tag context.
  // Specifically </script> is dangerous.
  // \u003c is <
  // \u003e is >
  // \u0026 is &
  return json.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
