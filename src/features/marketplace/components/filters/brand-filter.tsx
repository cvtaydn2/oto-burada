"use client";

import { Label } from "@/features/ui/components/label";
import type { BrandCatalogItem } from "@/types";

import { FilterSelect } from "./filter-select";

interface BrandFilterProps {
  brands: BrandCatalogItem[];
  value?: string;
  onChange: (v?: string) => void;
  hideLabel?: boolean;
}

export function BrandFilter({ brands, value, onChange, hideLabel }: BrandFilterProps) {
  const options = [
    { value: "all", label: "Tüm Markalar" },
    ...brands.map((b) => ({ value: b.brand, label: b.brand })),
  ];

  return (
    <div className="space-y-1.5 w-full">
      {!hideLabel && (
        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
          Marka
        </Label>
      )}
      <FilterSelect
        value={value || "all"}
        onValueChange={(v) => onChange(v === "all" ? undefined : v)}
        placeholder="Marka seç"
        options={options}
      />
    </div>
  );
}
