/* eslint-disable */
"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

/**
 * World-Class UX: Hydration-Safe Date (Issue 7 - "The Seam")
 * Prevents Next.js "Text content did not match" errors.
 */

interface FormattedDateProps {
  date: string | Date;
  formatStr?: string;
  className?: string;
}

export function FormattedDate({ 
  date, 
  formatStr = "d MMMM yyyy HH:mm", 
  className 
}: FormattedDateProps) {
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setMounted(true);
  }, []);

  const dateObj = useMemo(() => (typeof date === "string" ? new Date(date) : date), [date]);

  const formattedStr = useMemo(() => {
    if (!mounted) return "";
    try {
      return format(dateObj, formatStr, { locale: tr });
    } catch (_err) {
      return "Tarih hatası";
    }
  }, [dateObj, formatStr, mounted]);

  if (!mounted) {
    return <span className={className}>...</span>;
  }

  return (
    <time dateTime={dateObj.toISOString()} className={className}>
      {formattedStr}
    </time>
  );
}
