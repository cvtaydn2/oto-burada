"use client";

import { Button } from "@/components/ui/button";
import { formatTL } from "@/lib/utils";
import { type ListingFilters } from "@/types";

interface ActiveFilterTagsProps {
  filters: ListingFilters;
  handleFilterChange: <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => void;
  handleReset: () => void;
  applyFilters: (newFilters: ListingFilters, immediate: boolean) => void;
  setFilters: (filters: ListingFilters) => void;
}

export function ActiveFilterTags({
  filters,
  handleFilterChange,
  handleReset,
  applyFilters,
  setFilters,
}: ActiveFilterTagsProps) {
  const activeFiltersCount = Object.entries(filters).filter(([key, val]) => {
    if (key === "limit" || key === "sort" || key === "page") return false;
    return val !== undefined && val !== "";
  }).length;

  if (activeFiltersCount === 0) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-1">
        Aktif Süzgeçler:
      </span>

      {filters.brand && (
        <FilterTag
          label={filters.brand}
          onRemove={() => {
            const nextFilters = {
              ...filters,
              brand: undefined,
              carTrim: undefined,
              model: undefined,
              page: 1,
            };
            setFilters(nextFilters);
            applyFilters(nextFilters, true);
          }}
        />
      )}
      {filters.model && (
        <FilterTag label={filters.model} onRemove={() => handleFilterChange("model", undefined)} />
      )}
      {filters.carTrim && (
        <FilterTag
          label={filters.carTrim}
          onRemove={() => handleFilterChange("carTrim", undefined)}
        />
      )}
      {filters.city && (
        <FilterTag
          label={filters.city}
          onRemove={() => {
            const nextFilters = { ...filters, city: undefined, district: undefined, page: 1 };
            setFilters(nextFilters);
            applyFilters(nextFilters, true);
          }}
        />
      )}
      {filters.district && (
        <FilterTag
          label={filters.district}
          onRemove={() => handleFilterChange("district", undefined)}
        />
      )}
      {filters.fuelType && (
        <FilterTag
          label={
            filters.fuelType === "benzin"
              ? "Benzin"
              : filters.fuelType === "dizel"
                ? "Dizel"
                : filters.fuelType
          }
          onRemove={() => handleFilterChange("fuelType", undefined)}
        />
      )}
      {filters.transmission && (
        <FilterTag
          label={
            filters.transmission === "otomatik"
              ? "Otomatik"
              : filters.transmission === "manuel"
                ? "Manuel"
                : "Yarı Otomatik"
          }
          onRemove={() => handleFilterChange("transmission", undefined)}
        />
      )}
      {(filters.minPrice || filters.maxPrice) && (
        <FilterTag
          label={`${filters.minPrice ? formatTL(filters.minPrice) : "0"} — ${filters.maxPrice ? formatTL(filters.maxPrice) : "∞"}`}
          onRemove={() => {
            const f = { ...filters, minPrice: undefined, maxPrice: undefined, page: 1 };
            setFilters(f);
            applyFilters(f, true);
          }}
        />
      )}
      {(filters.minYear || filters.maxYear) && (
        <FilterTag
          label={`Model ${filters.minYear ?? "eski"}-${filters.maxYear ?? "güncel"}`}
          onRemove={() => {
            const nextFilters = { ...filters, minYear: undefined, maxYear: undefined, page: 1 };
            setFilters(nextFilters);
            applyFilters(nextFilters, true);
          }}
        />
      )}
      {filters.maxMileage !== undefined && (
        <FilterTag
          label={`Max ${filters.maxMileage.toLocaleString("tr-TR")} km`}
          onRemove={() => handleFilterChange("maxMileage", undefined)}
        />
      )}
      {filters.maxTramer !== undefined && (
        <FilterTag
          label={`Max ${filters.maxTramer.toLocaleString("tr-TR")} TL tramer`}
          onRemove={() => handleFilterChange("maxTramer", undefined)}
        />
      )}
      {filters.query && (
        <FilterTag
          label={`"${filters.query}"`}
          onRemove={() => handleFilterChange("query", undefined)}
        />
      )}
      {filters.hasExpertReport && (
        <FilterTag
          label="Ekspertizli"
          onRemove={() => handleFilterChange("hasExpertReport", undefined)}
        />
      )}

      <Button
        onClick={handleReset}
        className="text-[10px] font-bold text-destructive hover:underline uppercase tracking-widest pl-2"
      >
        Temizle
      </Button>
    </div>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="group flex items-center gap-2 rounded-xl border border-border bg-card pl-3 pr-1.5 py-1.5 text-[10px] font-bold text-foreground uppercase tracking-widest shadow-sm hover:border-foreground/30 transition-all">
      <span>{label}</span>
      <Button
        onClick={onRemove}
        className="size-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-all"
      >
        <svg
          className="size-2.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </Button>
    </div>
  );
}
