"use client";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RangeFilterProps {
  label: string;
  unit: string;
  min?: number;
  max?: number;
  onMinChange: (v?: number) => void;
  onMaxChange: (v?: number) => void;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  hideLabel?: boolean;
}

function buildRangeItemLabel(label: string, bound: "minimum" | "maximum", unit: string) {
  const suffix = unit.trim().length > 0 ? ` (${unit})` : "";
  return `${label} ${bound}${suffix}`;
}

export function RangeFilter({
  label,
  unit,
  min,
  max,
  onMinChange,
  onMaxChange,
  minPlaceholder,
  maxPlaceholder,
  hideLabel,
}: RangeFilterProps) {
  return (
    <div className="w-full space-y-1.5">
      {!hideLabel && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {label}
          </span>
          <span className="text-[10px] font-medium uppercase text-muted-foreground">{unit}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Field className="w-1/2">
          <Label className="sr-only">{buildRangeItemLabel(label, "minimum", unit)}</Label>
          <Input
            type="number"
            placeholder={minPlaceholder}
            value={min ?? ""}
            onChange={(e) => onMinChange(e.target.value ? Number(e.target.value) : undefined)}
            className="h-12 w-full rounded-xl border border-border/40 bg-muted/20 px-4 py-2 text-sm outline-none transition-all placeholder:text-muted-foreground/30 focus:ring-2 focus:ring-primary/20"
          />
        </Field>

        <div className="h-[1px] w-2 shrink-0 bg-border" />

        <Field className="w-1/2">
          <Label className="sr-only">{buildRangeItemLabel(label, "maximum", unit)}</Label>
          <Input
            type="number"
            placeholder={maxPlaceholder}
            value={max ?? ""}
            onChange={(e) => onMaxChange(e.target.value ? Number(e.target.value) : undefined)}
            className="h-12 w-full rounded-xl border border-border/40 bg-muted/20 px-4 py-2 text-sm outline-none transition-all placeholder:text-muted-foreground/30 focus:ring-2 focus:ring-primary/20"
          />
        </Field>
      </div>
    </div>
  );
}
