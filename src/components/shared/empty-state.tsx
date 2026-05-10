"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  illustration?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  illustration,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-border/80 bg-card/75 px-4 py-14 text-center shadow-sm shadow-slate-950/5 sm:px-6 sm:py-16",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Illustration or Icon */}
      {illustration && (
        <div className="mb-6 size-32 text-muted-foreground/40 animate-in fade-in duration-500">
          {illustration}
        </div>
      )}

      {icon && !illustration && (
        <div className="mb-6 flex size-20 items-center justify-center rounded-full border border-border/70 bg-muted/45 text-muted-foreground/60 animate-in fade-in duration-500">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="mb-3 text-xl font-bold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 sm:text-2xl">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="mb-8 max-w-md text-sm leading-6 text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          {description}
        </p>
      )}

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex w-full max-w-md flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 sm:flex-row">
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              className="flex-1"
              size="lg"
              asChild={!!primaryAction.href}
            >
              {primaryAction.href ? (
                <Link href={primaryAction.href}>{primaryAction.label}</Link>
              ) : (
                primaryAction.label
              )}
            </Button>
          )}

          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              className="flex-1"
              size="lg"
              asChild={!!secondaryAction.href}
            >
              {secondaryAction.href ? (
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              ) : (
                secondaryAction.label
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
