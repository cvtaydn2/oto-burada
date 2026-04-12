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
          "flex h-12 w-full items-center justify-between rounded-2xl border-none bg-slate-50 px-5 py-2 text-sm font-bold text-slate-700 outline-none hover:bg-slate-100 focus:ring-4 focus:ring-primary/5 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="size-4 text-slate-300" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="overflow-hidden rounded-2xl border border-slate-50 bg-white/90 backdrop-blur-xl shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200"
          position="popper"
          sideOffset={8}
        >
          <SelectPrimitive.Viewport className="p-2 min-w-[200px]">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-slate-600 outline-none transition-all",
                  "data-[highlighted]:bg-primary/5 data-[highlighted]:text-primary"
                )}
              >
                <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="size-4 text-primary" strokeWidth={3} />
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