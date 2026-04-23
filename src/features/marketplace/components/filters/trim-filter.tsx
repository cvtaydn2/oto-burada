"use client";

import type { BrandCatalogItem } from "@/types";

import { FilterSelect } from "./filter-select";

interface TrimFilterProps {
  brands: BrandCatalogItem[];
  brand?: string;
  model?: string;
  value?: string;
  onChange: (v?: string) => void;
  hideLabel?: boolean;
}

export function TrimFilter({ brands, brand, model, value, onChange, hideLabel }: TrimFilterProps) {
  const trims =
    brands.find((b) => b.brand === brand)?.models?.find((m) => m.name === model)?.trims || [];
  const options = [
    { value: "all", label: "Tüm Paketler" },
    ...trims.map((t) => ({ value: t, label: t })),
  ];

  return (
    <div className="space-y-1.5 w-full">
      {!hideLabel && (
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
          Paket
        </label>
      )}
      <FilterSelect
        value={value || "all"}
        onValueChange={(v) => onChange(v === "all" ? undefined : v)}
        placeholder="Paket seç"
        options={options}
        disabled={!brand || !model}
      />
    </div>
  );
}
