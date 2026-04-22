import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface FormattedDateProps {
  date: string | Date;
  formatStr?: string;
  className?: string;
}

/**
 * Server-safe date component using suppressHydrationWarning.
 * This avoids hydration mismatches due to timezone differences between server and client.
 */
export function FormattedDate({ 
  date, 
  formatStr = "d MMMM yyyy HH:mm", 
  className 
}: FormattedDateProps) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  let formattedStr = "";
  try {
    formattedStr = format(dateObj, formatStr, { locale: tr });
  } catch (err) {
    formattedStr = "Geçersiz Tarih";
  }

  return (
    <time 
      dateTime={dateObj instanceof Date ? dateObj.toISOString() : undefined} 
      className={className}
      suppressHydrationWarning
    >
      {formattedStr}
    </time>
  );
}
