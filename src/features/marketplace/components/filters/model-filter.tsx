"use client";

import type { BrandCatalogItem } from "@/types";

import { FilterSelect } from "./filter-select";

interface ModelFilterProps {
  brands: BrandCatalogItem[];
  brand?: string;
  value?: string;
  onChange: (v?: string) => void;
  hideLabel?: boolean;
}

export function ModelFilter({ brands, brand, value, onChange, hideLabel }: ModelFilterProps) {
  const models = (brands.find((b) => b.brand === brand)?.models || []).map((m) => m.name);
  const options = [
    { value: "all", label: "Tüm Modeller" },
    ...models.map((m) => ({ value: m, label: m })),
  ];

  return (
    <div className="space-y-1.5 w-full">
      {!hideLabel && (
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
          Model
        </label>
      )}
      <FilterSelect
        value={value || "all"}
        onValueChange={(v) => onChange(v === "all" ? undefined : v)}
        placeholder="Model seç"
        options={options}
        disabled={!brand}
      />
    </div>
  );
}
