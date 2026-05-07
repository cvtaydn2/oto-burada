"use client";

import { cn } from "@/features/shared/lib";
import { Button } from "@/features/ui/components/button";

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
      className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}
      role="status"
      aria-live="polite"
    >
      {/* Illustration or Icon */}
      {illustration && (
        <div className="mb-6 size-32 text-muted-foreground/30 animate-in fade-in duration-500">
          {illustration}
        </div>
      )}

      {icon && !illustration && (
        <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/50 animate-in fade-in duration-500">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="mb-3 text-xl sm:text-2xl font-bold text-foreground tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="mb-8 max-w-md text-sm text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          {description}
        </p>
      )}

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              className="flex-1"
              size="lg"
              asChild={!!primaryAction.href}
            >
              {primaryAction.href ? (
                <a href={primaryAction.href}>{primaryAction.label}</a>
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
                <a href={secondaryAction.href}>{secondaryAction.label}</a>
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
