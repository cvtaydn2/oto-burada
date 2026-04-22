"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface FormattedDateProps {
  date: string | Date;
  formatStr?: string;
  className?: string;
}

/**
 * Hydration-safe date component using suppressHydrationWarning.
 * This avoids the "mounted" state flicker while keeping the UI consistent.
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
      dateTime={dateObj.toISOString()} 
      className={className}
      suppressHydrationWarning
    >
      {formattedStr}
    </time>
  );
}
