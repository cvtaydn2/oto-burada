"use client";

import React from "react";

import { Button } from "@/features/ui/components/button";
import { Label } from "@/features/ui/components/label";
import { cn } from "@/lib";

interface ChoiceGroupProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  labels?: Partial<Record<T, string>>;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  error?: string;
}

/**
 * A segmented selection group matching the Showroom Elite design.
 * Uses a toggle-button group style for Fuel Type, Transmission, etc.
 */
export function ChoiceGroup<T extends string>({
  options,
  value,
  onChange,
  className,
  labels,
  disabled,
  label,
  required,
  error,
}: ChoiceGroupProps<T>) {
  const id = React.useId();

  return (
    <div className={cn("space-y-1.5", className)} role="radiogroup" aria-labelledby={`${id}-label`}>
      {label && (
        <Label
          id={`${id}-label`}
          className="block text-sm font-bold text-foreground uppercase tracking-wider mb-0.5"
        >
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = value === option;
          const optionId = `${id}-${option}`;
          return (
            <Button
              key={option}
              id={optionId}
              type="button"
              role="radio"
              aria-checked={isActive}
              disabled={disabled}
              onClick={() => onChange(option)}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background border-border text-muted-foreground hover:bg-muted/50",
                disabled && "opacity-50 cursor-not-allowed grayscale-[0.5]"
              )}
            >
              {labels?.[option] ?? option}
            </Button>
          );
        })}
      </div>
      {error && (
        <p
          role="alert"
          className="text-[11px] font-semibold text-destructive mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1"
        >
          {error}
        </p>
      )}
    </div>
  );
}
