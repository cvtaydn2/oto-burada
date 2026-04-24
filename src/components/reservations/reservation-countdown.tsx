"use client";

import { Clock, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { reservation as copy } from "@/lib/constants/ui-strings";
import { cn } from "@/lib/utils";

interface ReservationCountdownProps {
  expiresAt: string;
  className?: string;
  onExpire?: () => void;
}

export function ReservationCountdown({
  expiresAt,
  className,
  onExpire,
}: ReservationCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    function calculate() {
      const now = Date.now();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        onExpire?.();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds, expired: false });
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (timeLeft.expired) {
    return (
      <span className={cn("text-sm text-muted-foreground", className)}>
        {copy.countdownExpired}
      </span>
    );
  }

  const urgent = timeLeft.hours < 2;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm font-mono",
        urgent ? "text-red-600" : "text-muted-foreground",
        className
      )}
    >
      <Clock className="h-3.5 w-3.5" />
      <span>
        {timeLeft.hours > 0 ? `${timeLeft.hours}s.` : ""}
        {timeLeft.minutes}d. {timeLeft.seconds}sn.
      </span>
    </span>
  );
}

interface ReservationStatusBadgeProps {
  status:
    | "pending_payment"
    | "active"
    | "completed"
    | "cancelled_by_buyer"
    | "cancelled_by_seller"
    | "expired";
  className?: string;
}

export function ReservationStatusBadge({ status, className }: ReservationStatusBadgeProps) {
  const config: Record<
    ReservationStatusBadgeProps["status"],
    { label: string; className: string }
  > = {
    pending_payment: {
      label: copy.pendingPayment,
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    active: {
      label: copy.active,
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    completed: {
      label: copy.completed,
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
    cancelled_by_buyer: {
      label: copy.cancelled,
      className: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
    },
    cancelled_by_seller: {
      label: copy.cancelled,
      className: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
    },
    expired: {
      label: copy.expired,
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
  };

  const { label, className: badgeClassName } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeClassName,
        className
      )}
    >
      <ShieldCheck className="h-3 w-3" />
      {label}
    </span>
  );
}
