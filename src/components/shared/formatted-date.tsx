import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface FormattedDateProps {
  date: string | Date;
  formatStr?: string;
  className?: string;
}

/**
 * Server-safe date component.
 * suppressHydrationWarning is intentional: server and client may render
 * slightly different times due to timezone differences. This is expected
 * and safe — the content is cosmetic, not security-sensitive.
 */
export function FormattedDate({
  date,
  formatStr = "d MMMM yyyy HH:mm",
  className,
}: FormattedDateProps) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const isValid = dateObj instanceof Date && !isNaN(dateObj.getTime());

  let formattedStr = "";
  if (!isValid) {
    formattedStr = "—";
  } else {
    try {
      formattedStr = format(dateObj, formatStr, { locale: tr });
    } catch {
      formattedStr = "—";
    }
  }

  return (
    <time
      dateTime={isValid ? dateObj.toISOString() : undefined}
      className={className}
      suppressHydrationWarning
    >
      {formattedStr}
    </time>
  );
}
