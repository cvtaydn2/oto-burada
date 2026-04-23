"use client";

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
    <div className="space-y-1.5 w-full">
      {!hideLabel && (
        <div className="flex justify-between items-center px-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {label}
          </label>
          <span className="text-[10px] text-muted-foreground font-medium uppercase">{unit}</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder={minPlaceholder}
          value={min ?? ""}
          onChange={(e) => onMinChange(e.target.value ? Number(e.target.value) : undefined)}
          className="w-1/2 h-12 border border-border/40 rounded-xl px-4 py-2 text-sm bg-muted/20 focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/30"
        />
        <div className="w-2 h-[1px] bg-border shrink-0" />
        <input
          type="number"
          placeholder={maxPlaceholder}
          value={max ?? ""}
          onChange={(e) => onMaxChange(e.target.value ? Number(e.target.value) : undefined)}
          className="w-1/2 h-12 border border-border/40 rounded-xl px-4 py-2 text-sm bg-muted/20 focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/30"
        />
      </div>
    </div>
  );
}
