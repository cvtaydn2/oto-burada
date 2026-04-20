/**
 * Email validation utilities for spam prevention.
 * 
 * Blocks disposable/temporary email services commonly used by spammers.
 */

import { DISPOSABLE_DOMAINS } from "@/config/disposable-domains";

// Fast lookup set initialized once
const DISPOSABLE_SET = new Set(DISPOSABLE_DOMAINS.map(d => d.toLowerCase()));

/**
 * Check if an email address uses a disposable/temporary email service.
 * Support case-insensitive domain parsing.
 * 
 * @param email - The email address to check
 * @returns true if the domain is a known disposable service
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  if (!email.includes("@")) return false;

  const parts = email.trim().toLowerCase().split("@");
  const domain = parts[parts.length - 1]; // Support nested at signs if any (though invalid)
  
  if (!domain) return false;

  return DISPOSABLE_SET.has(domain);
}

/**
 * Get a human-readable message for disposable email rejection.
 */
export function getDisposableEmailMessage(): string {
  return "Geçici e-posta adresleri kabul edilmemektedir. Lütfen kalıcı bir e-posta adresi kullanın.";
}

/**
 * Strategy to update the domain list if needed in the future.
 * Currently just returns the static count.
 */
export function getDisposableDomainCount(): number {
  return DISPOSABLE_SET.size;
}
