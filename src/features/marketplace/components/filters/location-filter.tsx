"use client";

import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import type { CityOption } from "@/types";

import { FilterSelect } from "./filter-select";

interface LocationFilterProps {
  cities: CityOption[];
  city?: string;
  district?: string;
  onCityChange: (v?: string) => void;
  onDistrictChange: (v?: string) => void;
  hideLabel?: boolean;
}

export function LocationFilter({
  cities,
  city,
  district,
  onCityChange,
  onDistrictChange,
  hideLabel,
}: LocationFilterProps) {
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field className="space-y-1.5">
        <Label
          className={
            hideLabel
              ? "sr-only"
              : "px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
          }
        >
          Şehir
        </Label>
        <FilterSelect
          value={city || "all"}
          onValueChange={(v) => onCityChange(v === "all" ? undefined : v)}
          placeholder="Şehir seç"
          options={cityOptions}
        />
      </Field>

      <Field className="space-y-1.5">
        <Label
          className={
            hideLabel
              ? "sr-only"
              : "px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
          }
        >
          İlçe
        </Label>
        <FilterSelect
          value={district || "all"}
          onValueChange={(v) => onDistrictChange(v === "all" ? undefined : v)}
          placeholder="İlçe seç"
          options={districtOptions}
          disabled={!city}
        />
      </Field>
    </div>
  );
}
