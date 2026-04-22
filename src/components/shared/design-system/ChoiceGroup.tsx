"use client";

import { cn } from "@/lib/utils";

interface ChoiceGroupProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  labels?: Partial<Record<T, string>>;
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
}: ChoiceGroupProps<T>) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const isActive = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 border",
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background border-border text-muted-foreground hover:bg-muted/50"
            )}
          >
            {labels?.[option] ?? option}
          </button>
        );
      })}
    </div>
  );
}
