/**
 * Input sanitization utilities.
 *
 * SECURITY: Multi-layered XSS protection with regex-based stripping
 * and proper HTML entity encoding. Designed to be XSS-bypass resistant.
 *
 * ── UI/UX: Issue #31 - Sanitization Safety Documentation ───────
 * IMPORTANT RENDER CONTEXT SAFETY:
 * - ✅ SAFE: JSX text rendering: <div>{sanitizedText}</div>
 * - ✅ SAFE: textarea value: <textarea value={sanitizedText} />
 * - ❌ UNSAFE: dangerouslySetInnerHTML (never use with user content)
 * - ❌ UNSAFE: innerHTML DOM manipulation
 *
 * React automatically escapes text content, providing XSS protection.
 * These sanitizers provide defense-in-depth by removing HTML before React sees it.
 */

/**
 * Sanitize a user-provided string for safe storage and rendering.
 * Removes all HTML tags and returns plain text.
 *
 * @safe-for JSX text rendering only
 * @NOT-SAFE-FOR dangerouslySetInnerHTML or innerHTML
 */
export function sanitizeText(value: string): string {
  if (!value) return "";
  return stripAllHtmlSecure(value);
}

/**
 * Sanitize a multiline description field.
 * Allows only line breaks for readability, strips everything else.
 *
 * @safe-for JSX text rendering, textarea value
 * @NOT-SAFE-FOR dangerouslySetInnerHTML or innerHTML
 */
export function sanitizeDescription(value: string): string {
  if (!value) return "";
  // We keep newlines as-is, but strip all HTML tags
  return stripAllHtmlSecure(value);
}

/**
 * Sanitize a value for use in meta tags (title / description).
 * Strips all tags and collapses whitespace into single spaces.
 *
 * @safe-for meta tags, og:title, og:description
 */
export function sanitizeForMeta(value: string): string {
  return sanitizeText(value)
    .replace(/[\r\n]+/g, " ")
    .replace(/\s{2 }/g, " ")
    .trim();
}

/**
 * Escape the basic HTML-significant characters.
 * Essential for rendering untrusted content in non-JSX contexts.
 *
 * @safe-for HTML attributes, data attributes
 * @use-case When you need to manually construct HTML strings (rare in React)
 */
/**
 * Escape string for use in RegExp constructor.
 * Protects against dynamic regex construction vulnerabilities.
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export function escapeHtml(value: string): string {
  const HTML_ENTITY_MAP: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;", // Forward slash for extra safety
  };
  return value.replace(/[&<>"'/]/g, (char) => HTML_ENTITY_MAP[char] ?? char);
}

/**
 * SECURITY-HARDENED: Multi-pass HTML stripping to prevent XSS bypass techniques.
 *
 * CRITICAL FIX: Strip HTML tags BEFORE decoding entities to prevent double-encoding attacks.
 * Old order (decode then strip) allowed: &amp;lt;script&amp;gt; → &lt;script&gt; → <script>
 * New order (strip then decode) prevents: <script> removed first, entities decoded safely after.
 *
 * Protects against:
 * - Nested tags: <<script>script>
 * - Encoded tags: &lt;script&gt;
 * - Malformed tags: <img/src=x onerror=alert(1)>
 * - Event handlers: onload, onerror, onclick, etc.
 * - JavaScript URLs: javascript:, data:text/html, vbscript:
 * - CSS expressions: expression(), -moz-binding
 */
function stripAllHtmlSecure(value: string): string {
  let cleaned = value;

  // STEP 1: Remove dangerous protocols (multiple passes for nested encoding)
  for (let i = 0; i < 3; i++) {
    cleaned = cleaned
      .replace(/javascript\s*:/gi, "")
      .replace(/vbscript\s*:/gi, "")
      .replace(/data\s*:\s*text\/html/gi, "")
      .replace(/data\s*:\s*application\/javascript/gi, "");
  }

  // STEP 2: Remove script/style/iframe/object/embed tags with content (multiple passes)
  for (let i = 0; i < 3; i++) {
    cleaned = cleaned
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "");
  }

  // STEP 3: Remove event handlers (comprehensive list)
  const eventHandlers = [
    "onload",
    "onerror",
    "onclick",
    "onmouseover",
    "onmouseout",
    "onmousedown",
    "onmouseup",
    "onkeydown",
    "onkeyup",
    "onkeypress",
    "onfocus",
    "onblur",
    "onchange",
    "onsubmit",
    "onreset",
    "onselect",
    "onresize",
    "onscroll",
    "onunload",
    "onbeforeunload",
    "ondblclick",
    "oncontextmenu",
    "ondrag",
    "ondrop",
    "onanimationend",
    "ontransitionend",
  ];

  eventHandlers.forEach((handler) => {
    const escapedHandler = escapeRegExp(handler);
    const regex = new RegExp(`\\s*${escapedHandler}\\s*=\\s*[^\\s>]*`, "gi");
    cleaned = cleaned.replace(regex, "");
  });

  // STEP 4: CRITICAL FIX - Strip ALL HTML tags FIRST (before decoding entities)
  // This prevents double-encoding attacks where entities are decoded then re-encoded
  for (let i = 0; i < 5; i++) {
    cleaned = cleaned.replace(/<[^>]*>/g, "");
  }

  // STEP 5: NOW decode HTML entities (safe after tags are removed)
  // This converts &amp; to & for display purposes
  cleaned = cleaned
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/")
    .replace(/&amp;/gi, "&");

  // STEP 5.5: CRITICAL - Strip tags AGAIN after entity decoding
  // This catches encoded tags like &lt;script&gt; that become <script> after decoding
  cleaned = cleaned.replace(/<[^>]*>/g, "");

  // STEP 6: Remove CSS expressions and -moz-binding
  cleaned = cleaned
    .replace(/expression\s*\(/gi, "")
    .replace(/-moz-binding\s*:/gi, "")
    .replace(/behavior\s*:/gi, "");

  // STEP 7: Final cleanup
  return cleaned.trim();
}

/**
 * SECURITY: Additional validation for critical fields
 * Use this for fields that will be displayed prominently (titles, names)
 */
export function sanitizeCriticalText(value: string): string {
  const cleaned = sanitizeText(value);

  // Additional checks for critical fields
  if (cleaned.length > 1000) {
    throw new Error("Text too long for critical field");
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /javascript/i,
    /vbscript/i,
    /expression/i,
    /onload/i,
    /onerror/i,
    /<.*>/,
    // FIXED: Only match actual HTML entities, not ampersands in normal text
    // Old pattern /&.*;/ matched "AT&T", "Tom & Jerry", etc.
    /&[a-z]+;/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(cleaned)) {
      throw new Error("Suspicious content detected in critical field");
    }
  }

  return cleaned;
}
