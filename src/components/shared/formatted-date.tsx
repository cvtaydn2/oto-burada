"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

/**
 * World-Class UX: Hydration-Safe Date (Issue 7 - "The Seam")
 * Prevents Next.js "Text content did not match" errors caused by 
 * server-client timezone differences.
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

  // Use local time only after mounting on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (!mounted) {
    // Return a stable placeholder (UTC or empty) during SSR
    return <span className={className}>...</span>;
  }

  try {
    return (
      <time dateTime={dateObj.toISOString()} className={className}>
        {format(dateObj, formatStr, { locale: tr })}
      </time>
    );
  } catch (error) {
    return <span className={className}>Tarih hatası</span>;
  }
}
