export const CURRENT_YEAR = new Date().getFullYear();

export function formatDate(date: Date | string, format?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;

  // Check if format is a valid BCP 47 locale (e.g. "tr-TR", "en-US")
  const isLocale = format && /^[a-z]{2}(-[a-zA-Z]{2,8})?$/i.test(format);
  const locale = isLocale ? format : "tr-TR";

  // Define default formatting options
  let options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  if (format && !isLocale) {
    options = {};
    if (format.includes("yyyy")) {
      options.year = "numeric";
    } else if (format.includes("yy")) {
      options.year = "2-digit";
    } else {
      options.year = "numeric";
    }

    if (format.includes("MMMM")) {
      options.month = "long";
    } else if (format.includes("MMM")) {
      options.month = "short";
    } else if (format.includes("MM")) {
      options.month = "2-digit";
    } else if (format.includes("M")) {
      options.month = "numeric";
    } else {
      options.month = "long";
    }

    if (format.includes("dd")) {
      options.day = "2-digit";
    } else if (format.includes("d")) {
      options.day = "numeric";
    } else {
      options.day = "numeric";
    }

    if (
      format.includes("HH") ||
      format.includes("hh") ||
      format.includes("H") ||
      format.includes("h")
    ) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }
  }

  try {
    return new Intl.DateTimeFormat(locale, options).format(d);
  } catch {
    try {
      return new Intl.DateTimeFormat("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(d);
    } catch {
      return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : "-";
    }
  }
}

export function safeFormatDate(date: Date | string | null | undefined, format?: string): string {
  if (!date) return "-";
  return formatDate(date, format);
}
