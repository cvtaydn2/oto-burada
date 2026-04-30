import React from "react";

import { cn } from "@/lib/utils";

interface DesignInputProps extends React.InputHTMLAttributes<
  HTMLInputElement & HTMLSelectElement & HTMLTextAreaElement
> {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  as?: "input" | "select" | "textarea";
  rows?: number;
  showCounter?: boolean;
  maxLength?: number;
  currentLength?: number;
  hideLabel?: boolean;
  labelExtra?: React.ReactNode;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

/**
 * Shared Input component following the Showroom Elite design system.
 * Matches the HTML reference: Bold label + Standard border + Focus ring.
 */
export const DesignInput = React.forwardRef<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  DesignInputProps
>(
  (
    {
      label,
      required,
      error,
      helperText,
      as = "input",
      className,
      children,
      showCounter,
      maxLength,
      currentLength,
      hideLabel,
      labelExtra,
      leftAddon,
      rightAddon,
      ...props
    },
    ref
  ) => {
    const Component = as as React.ElementType;

    return (
      <div className={cn("space-y-1.5", hideLabel && "space-y-0")}>
        {!hideLabel && (
          <div className="flex items-center justify-between mb-0.5">
            <label className="block text-sm font-bold text-foreground uppercase tracking-wider">
              {label} {required && <span className="text-destructive">*</span>}
            </label>
            {labelExtra && <div className="flex items-center">{labelExtra}</div>}
            {!labelExtra && showCounter && maxLength !== undefined && (
              <span
                className={cn(
                  "text-[10px] font-mono",
                  (currentLength ?? 0) > maxLength * 0.9
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {currentLength ?? 0}/{maxLength}
              </span>
            )}
          </div>
        )}

        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-0 inset-y-0 flex items-center justify-center border-r border-border bg-muted/30 rounded-l-xl px-3 z-10">
              {leftAddon}
            </div>
          )}
          <Component
            ref={ref}
            className={cn(
              "w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all",
              "placeholder:text-muted-foreground/40 text-foreground",
              error ? "border-destructive bg-destructive/5" : "border-border bg-card",
              leftAddon && "pl-14",
              rightAddon && "pr-14",
              className
            )}
            maxLength={maxLength}
            {...props}
          >
            {children}
          </Component>
          {rightAddon && (
            <div className="absolute right-0 inset-y-0 flex items-center justify-center border-l border-border bg-muted/30 rounded-r-xl px-3 z-10">
              {rightAddon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-[11px] font-semibold text-destructive mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

DesignInput.displayName = "DesignInput";
