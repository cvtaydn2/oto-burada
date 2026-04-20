/**
 * Hyper-Scale Data Sanitization & Protection
 */

/**
 * Regex patterns for identifying sensitive or dangerous content.
 */
export const SECURITY_PATTERNS = {
  // Turkish IBAN pattern
  IBAN: /TR\d{24}|TR \d{4} \d{4} \d{4} \d{4} \d{4} \d{4} \d{2}/gi,
  
  // Turkish Mobile Phone pattern
  PHONE: /(\+90|0)?\s?5\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/g,
  
  // Generic URL pattern (excluding internal domains)
  URL: /(https?:\/\/(?!otoburada\.app|localhost|vercel\.app)[^\s]+)/gi,
};

/**
 * Masks sensitive patterns in content to prevent off-platform routing and phishing.
 * @param content The raw message content
 * @returns Masked content
 */
export function sanitizeChatMessage(content: string): string {
  let sanitized = content;

  // Mask IBAN
  sanitized = sanitized.replace(SECURITY_PATTERNS.IBAN, (match) => {
    return match.substring(0, 4) + "*".repeat(match.length - 4);
  });

  // Mask Phone
  sanitized = sanitized.replace(SECURITY_PATTERNS.PHONE, (match) => {
    const clean = match.replace(/\s/g, '');
    if (clean.length >= 10) {
      return match.substring(0, match.length - 4) + "****";
    }
    return match;
  });

  // Mask suspicious URLs
  sanitized = sanitized.replace(SECURITY_PATTERNS.URL, "[GÜVENLİ OLMAYAN BAĞLANTI MASKELENDİ]");

  return sanitized;
}

/**
 * Strips HTML tags and excessive whitespace.
 */
export function basicSanitize(content: string): string {
  return content
    .replace(/<[^>]*>?/gm, '') // Remove HTML
    .replace(/\s+/g, ' ')      // Collapse whitespace
    .trim();
}
