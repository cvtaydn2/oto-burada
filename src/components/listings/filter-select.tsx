"use client"

import * as SelectPrimitive from "@radix-ui/react-select"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterSelectProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder: string
  options: { value: string; label: string }[]
  className?: string
}

export function FilterSelect({
  value,
  onValueChange,
  placeholder,
  options,
  className,
}: FilterSelectProps) {
  return (
    <SelectPrimitive.Root value={value || ""} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        className={cn(
          "flex h-14 w-full items-center justify-between rounded-2xl border border-border/40 bg-secondary/30 px-6 py-2 text-sm font-bold text-foreground outline-none hover:bg-secondary/50 focus:ring-4 focus:ring-primary/5 disabled:cursor-not-allowed disabled:opacity-50 transition-all uppercase italic tracking-tight",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="size-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="overflow-hidden rounded-3xl border border-white/20 bg-card/80 backdrop-blur-2xl shadow-3xl z-[100] animate-in fade-in zoom-in-95 duration-200"
          position="popper"
          sideOffset={8}
        >
          <SelectPrimitive.Viewport className="p-3 min-w-[240px]">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-xl py-4 pl-12 pr-6 text-[13px] font-bold text-foreground/70 outline-none transition-all uppercase italic tracking-tight",
                  "data-[highlighted]:bg-primary data-[highlighted]:text-white data-[highlighted]:translate-x-1"
                )}
              >
                <span className="absolute left-4 flex h-4 w-4 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="size-4" strokeWidth={3} />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
