/**
 * Standardized date and time utilities for the OtoBurada platform.
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
 * Formats a date string or Date object into a localized Turkish date.
 * Example: "22 Ocak 2024"
 */
export function formatTurkishDate(date: string | Date | null | undefined): string {
  if (!date) return "-";

  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formats a date string or object into a human-readable format. (Alias for compatibility)
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
 * Formats a date to show relative time (e.g., "2 saat önce", "3 gün önce").
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "-";

  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "az önce";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} gün önce`;

  return formatTurkishDate(d);
}

/**
 * Returns a "time ago" string. (Alias for compatibility)
 */
export function getTimeAgo(date: string | Date | null) {
  return formatRelativeTime(date);
}

/**
 * Checks if a date is within the last N days.
 */
export function isRecent(date: string | Date, days: number = 7): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - d.getTime();
  return diffInMs < days * 24 * 60 * 60 * 1000;
}
