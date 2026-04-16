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
export function supabaseImageUrl(
  url: string,
  width: number,
  quality = 80,
): string {
  if (!url) return url;
  // Only transform Supabase Storage public URLs
  if (!url.includes(".supabase.co/storage/v1/object/public/")) {
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
