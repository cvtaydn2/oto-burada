"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import {
  fuelTypeLabels,
  fuelTypes,
  transmissionTypeLabels,
  transmissionTypes,
} from "@/lib/constants/domain";
import { cn } from "@/lib/utils";
import type { BrandCatalogItem, CityOption, ListingFilters } from "@/types";

interface FilterSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
}

export function FilterSelect({
  value,
  onValueChange,
  placeholder,
  options,
  disabled,
}: FilterSelectProps) {
  return (
    <SelectPrimitive.Root value={value || ""} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-xl border border-border/40 bg-muted/20 px-4 py-2 text-sm font-medium text-foreground outline-none transition-all hover:bg-muted/30 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
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

export const FilterFields = {
  Brand: ({
    brands,
    value,
    onChange,
    hideLabel,
  }: {
    brands: BrandCatalogItem[];
    value?: string;
    onChange: (v?: string) => void;
    hideLabel?: boolean;
  }) => {
    const options = [
      { value: "all", label: "Tüm Markalar" },
      ...brands.map((b) => ({ value: b.brand, label: b.brand })),
    ];
    return (
      <div className="space-y-1.5 w-full">
        {!hideLabel && (
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
            Marka
          </label>
        )}
        <FilterSelect
          value={value || "all"}
          onValueChange={(v) => onChange(v === "all" ? undefined : v)}
          placeholder="Marka seç"
          options={options}
        />
      </div>
    );
  },

  Model: ({
    brands,
    brand,
    value,
    onChange,
    hideLabel,
  }: {
    brands: BrandCatalogItem[];
    brand?: string;
    value?: string;
    onChange: (v?: string) => void;
    hideLabel?: boolean;
  }) => {
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
  },

  Trim: ({
    brands,
    brand,
    model,
    value,
    onChange,
    hideLabel,
  }: {
    brands: BrandCatalogItem[];
    brand?: string;
    model?: string;
    value?: string;
    onChange: (v?: string) => void;
    hideLabel?: boolean;
  }) => {
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
  },

  Location: ({
    cities,
    city,
    district,
    onCityChange,
    onDistrictChange,
    hideLabel,
  }: {
    cities: CityOption[];
    city?: string;
    district?: string;
    onCityChange: (v?: string) => void;
    onDistrictChange: (v?: string) => void;
    hideLabel?: boolean;
  }) => {
    const cityOptions = [
      { value: "all", label: "Tüm Şehirler" },
      ...cities.map((c) => ({ value: c.city, label: c.city })),
    ];
    const districts = cities.find((c) => c.city === city)?.districts || [];
    const districtOptions = [
      { value: "all", label: "Tüm İlçeler" },
      ...districts.map((d) => ({ value: d, label: d })),
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          {!hideLabel && (
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
              Şehir
            </label>
          )}
          <FilterSelect
            value={city || "all"}
            onValueChange={(v) => onCityChange(v === "all" ? undefined : v)}
            placeholder="Şehir seç"
            options={cityOptions}
          />
        </div>
        <div className="space-y-1.5">
          {!hideLabel && (
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
              İlçe
            </label>
          )}
          <FilterSelect
            value={district || "all"}
            onValueChange={(v) => onDistrictChange(v === "all" ? undefined : v)}
            placeholder="İlçe seç"
            options={districtOptions}
            disabled={!city}
          />
        </div>
      </div>
    );
  },

  Range: ({
    label,
    unit,
    min,
    max,
    onMinChange,
    onMaxChange,
    minPlaceholder,
    maxPlaceholder,
    hideLabel,
  }: {
    label: string;
    unit: string;
    min?: number;
    max?: number;
    onMinChange: (v?: number) => void;
    onMaxChange: (v?: number) => void;
    minPlaceholder?: string;
    maxPlaceholder?: string;
    hideLabel?: boolean;
  }) => (
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
  ),

  Technical: ({
    fuelType,
    transmission,
    onFuelChange,
    onTransmissionChange,
    hideLabel,
  }: {
    fuelType?: ListingFilters["fuelType"];
    transmission?: ListingFilters["transmission"];
    onFuelChange: (v?: ListingFilters["fuelType"]) => void;
    onTransmissionChange: (v?: ListingFilters["transmission"]) => void;
    hideLabel?: boolean;
  }) => (
    <div className="grid grid-cols-1 gap-6 w-full">
      <div className="space-y-3">
        {!hideLabel && (
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
            Yakıt Tipi
          </label>
        )}
        <div className="flex flex-wrap gap-2">
          {fuelTypes.map((type) => (
            <button
              key={type}
              onClick={() =>
                onFuelChange(fuelType === type ? undefined : (type as ListingFilters["fuelType"]))
              }
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                fuelType === type
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/10 border-border/40 text-muted-foreground hover:bg-muted/30"
              )}
            >
              {fuelTypeLabels[type]}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {!hideLabel && (
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
            Vites
          </label>
        )}
        <div className="flex flex-wrap gap-2">
          {transmissionTypes.map((type) => (
            <button
              key={type}
              onClick={() =>
                onTransmissionChange(
                  transmission === type ? undefined : (type as ListingFilters["transmission"])
                )
              }
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                transmission === type
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/10 border-border/40 text-muted-foreground hover:bg-muted/30"
              )}
            >
              {transmissionTypeLabels[type]}
            </button>
          ))}
        </div>
      </div>
    </div>
  ),

  Trust: ({
    hasExpertReport,
    maxTramer,
    onExpertReportChange,
    onMaxTramerChange,
    hideLabel,
  }: {
    hasExpertReport?: boolean;
    maxTramer?: number;
    onExpertReportChange: (v?: boolean) => void;
    onMaxTramerChange: (v?: number) => void;
    hideLabel?: boolean;
  }) => (
    <div className="grid grid-cols-1 gap-4 w-full">
      <div className="space-y-2">
        {!hideLabel && (
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
            Tramer
          </label>
        )}
        <input
          type="number"
          min={0}
          placeholder="Maks tramer tutarı"
          value={maxTramer ?? ""}
          onChange={(e) => onMaxTramerChange(e.target.value ? Number(e.target.value) : undefined)}
          className="h-12 w-full rounded-xl border border-border/40 bg-muted/20 px-4 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/30 focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <label className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/10 px-4 py-3 text-sm font-medium text-foreground cursor-pointer hover:bg-muted/20 transition-colors">
        <input
          type="checkbox"
          checked={hasExpertReport === true}
          onChange={() => onExpertReportChange(hasExpertReport ? undefined : true)}
          className="rounded border-border"
        />
        Ekspertiz raporlu ilanlar
      </label>
    </div>
  ),
};
