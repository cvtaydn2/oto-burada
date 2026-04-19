/**
 * Environment Variable Utilities
 * 
 * Provides type-safe access to required environment variables.
 * Throws errors at runtime if required variables are missing.
 */

/**
 * Get the application URL from environment variables.
 * 
 * @throws {Error} If NEXT_PUBLIC_APP_URL is not set
 * @returns The application URL without trailing slash
 * 
 * @example
 * const url = getRequiredAppUrl();
 * const listingUrl = `${url}/listing/${slug}`;
 */
export function getRequiredAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL environment variable is required but not set. " +
      "This is needed for generating absolute URLs in emails, notifications, and webhooks."
    );
  }
  
  // Remove trailing slash for consistency
  return url.replace(/\/$/, "");
}

/**
 * Get the application URL with a fallback for development.
 * Only use this in non-critical contexts where a fallback is acceptable.
 * 
 * @param fallback - Fallback URL (default: http://localhost:3000)
 * @returns The application URL without trailing slash
 */
export function getAppUrlWithFallback(fallback = "http://localhost:3000"): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? fallback;
  return url.replace(/\/$/, "");
}
