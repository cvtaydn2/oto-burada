"use client";

import { cn } from "@/lib/utils";

interface ChoiceGroupProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * A segmented selection group matching the Showroom Elite design.
 * Uses a toggle-button group style for Fuel Type, Transmission, etc.
 */
export function ChoiceGroup<T extends string>({ 
  options, 
  value, 
  onChange,
  className 
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
              "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 shadow-sm",
              isActive 
                ? "bg-blue-500 text-white shadow-blue-500/20" 
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 border-gray-200"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
