/**
 * Chat-specific sanitization utilities.
 *
 * Masks sensitive data (phone numbers, IBANs, external URLs) in user-generated
 * chat messages to prevent off-platform routing and phishing.
 */

/**
 * Regex patterns for identifying sensitive or dangerous content in chat.
 */
export const CHAT_SECURITY_PATTERNS = {
  // Turkish IBAN pattern
  IBAN: /TR\d{24}|TR \d{4} \d{4} \d{4} \d{4} \d{4} \d{4} \d{2}/gi,

  // Turkish Mobile Phone pattern
  PHONE: /(\+90|0)?\s?5\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/g,

  // Generic URL pattern (excluding internal domains)
  URL: /(https?:\/\/(?!otoburada\.app|localhost|vercel\.app)[^\s]+)/gi,
};

/**
 * Masks sensitive patterns in a chat message to prevent off-platform routing and phishing.
 */
export function sanitizeChatMessage(content: string): string {
  let sanitized = content;

  // Mask IBAN
  sanitized = sanitized.replace(CHAT_SECURITY_PATTERNS.IBAN, (match) => {
    return match.substring(0, 4) + "*".repeat(match.length - 4);
  });

  // Mask Phone
  sanitized = sanitized.replace(CHAT_SECURITY_PATTERNS.PHONE, (match) => {
    const clean = match.replace(/\s/g, "");
    if (clean.length >= 10) {
      return match.substring(0, match.length - 4) + "****";
    }
    return match;
  });

  // Mask suspicious external URLs
  sanitized = sanitized.replace(
    CHAT_SECURITY_PATTERNS.URL,
    "[GÜVENLİ OLMAYAN BAĞLANTI MASKELENDİ]"
  );

  return sanitized;
}

/**
 * Strips HTML tags and collapses excessive whitespace.
 */
export function basicSanitize(content: string): string {
  return content
    .replace(/<[^>]*>?/gm, "") // Remove HTML
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}
