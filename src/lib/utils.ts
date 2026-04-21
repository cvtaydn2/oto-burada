import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("tr-TR");

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Safe wrapper around date-fns formatDistanceToNow.
 * Returns "—" for null/undefined/invalid dates instead of throwing RangeError.
 */
export function safeFormatDistanceToNow(
  value: string | null | undefined,
): string {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";
  try {
    // Dynamic import not possible in sync context — use Intl.RelativeTimeFormat
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    const diffMonth = Math.round(diffDay / 30);
    const diffYear = Math.round(diffDay / 365);

    const rtf = new Intl.RelativeTimeFormat("tr-TR", { numeric: "auto" });

    if (Math.abs(diffSec) < 60) return rtf.format(-diffSec, "second");
    if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, "minute");
    if (Math.abs(diffHour) < 24) return rtf.format(-diffHour, "hour");
    if (Math.abs(diffDay) < 30) return rtf.format(-diffDay, "day");
    if (Math.abs(diffMonth) < 12) return rtf.format(-diffMonth, "month");
    return rtf.format(-diffYear, "year");
  } catch {
    return "—";
  }
}

/**
 * Safe date formatter using date-fns format pattern.
 * Returns "—" for null/undefined/invalid dates instead of throwing RangeError.
 */
export function safeFormatDate(
  value: string | null | undefined,
  pattern: string,
): string {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";
  try {
    // Use Intl for common patterns to avoid date-fns dependency in utils
    if (pattern === "dd MMM yy" || pattern === "dd MMM yyyy") {
      return date.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "short",
        year: pattern === "dd MMM yy" ? "2-digit" : "numeric",
      });
    }
    if (pattern === "dd MMM yyyy HH:mm") {
      return date.toLocaleString("tr-TR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (pattern === "HH:mm") {
      return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("tr-TR");
  } catch {
    return "—";
  }
}

/**
 * Formats a price as a plain Turkish number without currency symbol.
 * Use this when you want to display "1.250.000 TL" with a separate TL label.
 */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value);
}

/**
 * Compact Turkish Lira formatter for filter tags and range displays.
 * e.g. 1500000 → "₺1.5M", 500000 → "₺500K"
 */
export function formatTL(value: number): string {
  if (value >= 1_000_000) return `₺${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₺${(value / 1_000).toFixed(0)}K`;
  return `₺${value}`;
}

/**
 * Appends Supabase Storage image transformation query parameters to a URL.
 * Returns the original URL unchanged if it is not a Supabase Storage URL
 * (e.g. Unsplash, data URIs, or blob URLs).
 *
 * @param url     - Original image URL from Supabase Storage
 * @param width   - Desired output width in pixels
 * @param quality - JPEG/WebP quality 1-100 (default 80)
 *
 * Supabase Storage transform docs:
 * https://supabase.com/docs/guides/storage/serving/image-transformations
 */
/**
 * Appends Supabase Storage image transformation query parameters to a URL.
 * Returns the original URL unchanged if it is not a Supabase Storage URL
 * or if transformation is disabled via environment variable.
 *
 * @param url     - Original image URL from Supabase Storage
 * @param width   - Desired output width in pixels
 * @param quality - JPEG/WebP quality 1-100 (default 80)
 */
export function supabaseImageUrl(
  url: string,
  width: number,
  quality = 80,
): string {
  if (!url) return url;
  
  // Disable transformations by default if not explicitly enabled
  // Supabase Image Transformation is a paid feature.
  const isTransformationEnabled = process.env.NEXT_PUBLIC_ENABLE_IMAGE_TRANSFORMATION === "true";
  
  // Only transform Supabase Storage public URLs
  if (!url.includes(".supabase.co/storage/v1/object/public/") || !isTransformationEnabled) {
    return url;
  }

  try {
    const parsed = new URL(url);
    parsed.searchParams.set("width", String(width));
    parsed.searchParams.set("quality", String(quality));
    parsed.searchParams.set("resize", "cover");
    return parsed.toString();
  } catch {
    return url;
  }
}
