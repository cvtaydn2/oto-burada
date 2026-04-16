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

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
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
