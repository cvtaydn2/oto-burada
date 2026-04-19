/**
 * Application URL Utilities
 * 
 * Provides fail-closed URL generation for emails, notifications, and redirects.
 * NEVER uses hardcoded fallbacks to prevent wrong-environment link generation.
 */

/**
 * Gets the application URL from environment variables.
 * 
 * SECURITY: Fail-closed - throws error if URL is not configured.
 * This prevents sending emails/notifications with wrong URLs in production.
 * 
 * @throws Error if NEXT_PUBLIC_APP_URL is not set
 * @returns The configured application URL (without trailing slash)
 */
export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL environment variable is not set. " +
      "This is required for generating links in emails and notifications."
    );
  }
  
  // Remove trailing slash for consistency
  return url.replace(/\/$/, "");
}

/**
 * Gets the application URL with a fallback for development.
 * 
 * Use this ONLY in non-critical contexts where a fallback is acceptable
 * (e.g., local development, testing).
 * 
 * For production emails/notifications, use getAppUrl() instead.
 * 
 * @param fallback - Fallback URL for development (default: http://localhost:3000)
 * @returns The configured application URL or fallback
 */
export function getAppUrlOrFallback(fallback = "http://localhost:3000"): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  
  if (!url) {
    // Only allow fallback in development
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "NEXT_PUBLIC_APP_URL environment variable is not set in production. " +
        "This is required for generating links."
      );
    }
    
    return fallback.replace(/\/$/, "");
  }
  
  return url.replace(/\/$/, "");
}

/**
 * Builds a full URL from a path.
 * 
 * @param path - The path to append (e.g., "/listing/123")
 * @returns Full URL (e.g., "https://otoburada.com/listing/123")
 * @throws Error if NEXT_PUBLIC_APP_URL is not set
 */
export function buildAppUrl(path: string): string {
  const baseUrl = getAppUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Builds a full URL from a path with development fallback.
 * 
 * @param path - The path to append
 * @param fallback - Fallback base URL for development
 * @returns Full URL
 */
export function buildAppUrlOrFallback(path: string, fallback?: string): string {
  const baseUrl = getAppUrlOrFallback(fallback);
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
