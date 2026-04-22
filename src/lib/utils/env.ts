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

/**
 * Get internal Supabase Storage Render URL for image transformation.
 */
export function getOptimizedImageUrl(
  path: string | null | undefined,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    resize?: "cover" | "contain";
    /** Cache buster timestamp (Issue 8) */
    v?: string | number;
  } = {}
): string {
  if (!path) return "/placeholder-car.jpg";

  // If it's already an external URL, return as is
  if (path.startsWith("http")) return path;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!supabaseUrl) return path;

  const { width = 800, height, quality = 75, resize = "cover", v } = options;

  const bucket = "listings";
  const params = new URLSearchParams();
  params.append("width", width.toString());
  if (height) params.append("height", height.toString());
  params.append("quality", quality.toString());
  params.append("resize", resize);

  // ── PILL: Issue 8 - Storage Cache Buster ──────────────────────────
  // If a version is provided (like updated_at timestamp), we append it
  // to force CDN/Browser to fetch the fresh image if it changed.
  if (v) {
    params.append("v", v.toString());
  }

  return `${supabaseUrl}/storage/v1/render/image/public/${bucket}/${path}?${params.toString()}`;
}
