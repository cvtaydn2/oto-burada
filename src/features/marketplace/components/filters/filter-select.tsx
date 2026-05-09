"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import {} from "@/lib";
import { cn } from "@/lib/utils";

interface FilterSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
}

export function FilterSelect({
  value,
  onValueChange,
  placeholder,
  options,
  disabled,
  className,
}: FilterSelectProps) {
  return (
    <SelectPrimitive.Root value={value || ""} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-xl border border-border/40 bg-muted/20 px-4 py-2 text-sm font-medium text-foreground outline-none transition-all hover:bg-muted/30 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="size-4 text-muted-foreground/50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-lg z-[100] animate-in fade-in zoom-in-95 duration-150"
          position="popper"
          sideOffset={5}
        >
          <SelectPrimitive.Viewport className="p-2 min-w-[200px]">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-9 pr-4 text-sm outline-none transition-colors",
                  "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                )}
              >
                <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="size-3.5" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
