export const CURRENT_YEAR = new Date().getFullYear();

export function formatDate(date: Date | string, format?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const fmt = format || "tr-TR";
  const options: Intl.DateTimeFormatOptions = format?.includes("HH")
    ? { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
    : { year: "numeric", month: "long", day: "numeric" };
  return new Intl.DateTimeFormat(fmt, options).format(d);
}

export function safeFormatDate(date: Date | string | null | undefined, format?: string): string {
  if (!date) return "-";
  return formatDate(date, format);
}
