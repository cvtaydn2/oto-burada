import { cn } from "@/lib/utils";
import React from "react";

interface DesignInputProps extends React.InputHTMLAttributes<HTMLInputElement & HTMLSelectElement & HTMLTextAreaElement> {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  as?: "input" | "select" | "textarea";
  rows?: number;
  showCounter?: boolean;
  maxLength?: number;
  currentLength?: number;
}

/**
 * Shared Input component following the Showroom Elite design system.
 * Matches the HTML reference: Bold label + Standard border + Focus ring.
 */
export const DesignInput = React.forwardRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, DesignInputProps>(
  ({ label, required, error, helperText, as = "input", className, children, showCounter, maxLength, currentLength, ...props }, ref) => {
    const Component = as as React.ElementType;
    
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-foreground">
            {label} {required && <span className="text-destructive">*</span>}
          </label>
          {showCounter && maxLength !== undefined && (
            <span className={cn(
              "text-[10px] font-mono",
              (currentLength ?? 0) > maxLength * 0.9 ? "text-destructive" : "text-muted-foreground"
            )}>
              {currentLength ?? 0}/{maxLength}
            </span>
          )}
        </div>
        
        <div className="relative">
          <Component
            ref={ref}
            className={cn(
              "w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all",
              "placeholder:text-muted-foreground/40 text-foreground",
              error ? "border-destructive bg-destructive/5" : "border-border bg-card",
              className
            )}
            maxLength={maxLength}
            {...props}
          >
            {children}
          </Component>
        </div>

        {error ? (
          <p className="text-[11px] font-semibold text-destructive mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

DesignInput.displayName = "DesignInput";
