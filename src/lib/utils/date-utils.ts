/**
 * Centralized Date Utilities for OtoBurada.
 * Avoids hydration mismatches and hardcoded date logic across the app.
 */

export const CURRENT_YEAR = new Date().getFullYear();

/**
 * Returns an array of years from current back to a minimum year.
 * Used for form selects and filter options.
 */
export function getYearOptions(minYear = 1990) {
  const years = [];
  for (let year = CURRENT_YEAR; year >= minYear; year--) {
    years.push({ value: year.toString(), label: year.toString() });
  }
  return years;
}

/**
 * Formats a date string or object into a human-readable format.
 */
export function formatDate(
  date: string | Date | null,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  }
) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("tr-TR", options).format(d);
}

/**
 * Returns a "time ago" string.
 */
export function getTimeAgo(date: string | Date | null) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "az önce";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} gün önce`;
  return formatDate(date);
}
