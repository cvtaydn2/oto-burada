/**
 * URL Utilities for security and navigation
 */

/**
 * Validates a redirect URL to prevent Open Redirect vulnerabilities.
 * Only allows relative URLs starting with / (internal navigation).
 * 
 * @param url The redirect target candidate
 * @param fallback Default URL if invalid
 */
export function getSafeRedirect(url: string | null | undefined, fallback: string = "/dashboard"): string {
  if (!url) return fallback;

  // 1. Ensure it starts with / but not // (which could be protocol-relative to other domains)
  if (url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }

  // 2. Reject everything else
  return fallback;
}
