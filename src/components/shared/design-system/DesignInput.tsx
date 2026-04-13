import { cn } from "@/lib/utils";
import React from "react";

interface DesignInputProps extends React.InputHTMLAttributes<HTMLInputElement & HTMLSelectElement & HTMLTextAreaElement> {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  as?: "input" | "select" | "textarea";
  rows?: number;
}

/**
 * Shared Input component following the Showroom Elite design system.
 * Matches the HTML reference: Bold label + Standard border + Focus ring.
 */
export const DesignInput = React.forwardRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, DesignInputProps>(
  ({ label, required, error, helperText, as = "input", className, children, ...props }, ref) => {
    const Component = as as React.ElementType;
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        <div className="relative">
          <Component
            ref={ref}
            className={cn(
              "w-full border rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition-all",
              "placeholder-gray-400 text-gray-800",
              error ? "border-red-500 bg-red-50" : "border-gray-200 bg-white",
              className
            )}
            {...props}
          >
            {children}
          </Component>
        </div>

        {error ? (
          <p className="text-[11px] font-bold text-red-500 mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-[10px] text-gray-500 mt-2 ml-1">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

DesignInput.displayName = "DesignInput";
