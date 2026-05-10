"use client";

import { Button } from "@/components/ui/button";
import { formatTL } from "@/lib/utils/format";
import { type ListingFilters } from "@/types";

interface ActiveFilterTagsProps {
  filters: ListingFilters;
  applyInstantFilterChange: <K extends keyof ListingFilters>(
    key: K,
    value: ListingFilters[K]
  ) => void;
  handleReset: () => void;
  applyImmediateFilterPatch: (
    patch: Partial<ListingFilters>,
    options?: { scroll?: boolean }
  ) => void;
}

export function ActiveFilterTags({
  filters,
  applyInstantFilterChange,
  handleReset,
  applyImmediateFilterPatch,
}: ActiveFilterTagsProps) {
  const activeFiltersCount = Object.entries(filters).filter(([key, val]) => {
    if (key === "limit" || key === "sort" || key === "page") return false;
    return val !== undefined && val !== "";
  }).length;

  if (activeFiltersCount === 0) return null;

  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="pl-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Aktif Süzgeçler · {activeFiltersCount}
        </span>
        <Button
          onClick={handleReset}
          className="text-[10px] font-bold uppercase tracking-widest text-destructive hover:underline"
        >
          Temizle
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {filters.brand && (
          <FilterTag
            label={filters.brand}
            onRemove={() => applyInstantFilterChange("brand", undefined)}
          />
        )}
        {filters.model && (
          <FilterTag
            label={filters.model}
            onRemove={() => applyInstantFilterChange("model", undefined)}
          />
        )}
        {filters.carTrim && (
          <FilterTag
            label={filters.carTrim}
            onRemove={() => applyInstantFilterChange("carTrim", undefined)}
          />
        )}
        {filters.city && (
          <FilterTag
            label={filters.city}
            onRemove={() => applyInstantFilterChange("city", undefined)}
          />
        )}
        {filters.district && (
          <FilterTag
            label={filters.district}
            onRemove={() => applyInstantFilterChange("district", undefined)}
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
            onRemove={() => applyInstantFilterChange("fuelType", undefined)}
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
            onRemove={() => applyInstantFilterChange("transmission", undefined)}
          />
        )}
        {(filters.minPrice || filters.maxPrice) && (
          <FilterTag
            label={`${filters.minPrice ? formatTL(filters.minPrice) : "0"} — ${filters.maxPrice ? formatTL(filters.maxPrice) : "∞"}`}
            onRemove={() => applyImmediateFilterPatch({ minPrice: undefined, maxPrice: undefined })}
          />
        )}
        {(filters.minYear || filters.maxYear) && (
          <FilterTag
            label={`Model ${filters.minYear ?? "eski"}-${filters.maxYear ?? "güncel"}`}
            onRemove={() => applyImmediateFilterPatch({ minYear: undefined, maxYear: undefined })}
          />
        )}
        {filters.maxMileage !== undefined && (
          <FilterTag
            label={`Max ${filters.maxMileage.toLocaleString("tr-TR")} km`}
            onRemove={() => applyInstantFilterChange("maxMileage", undefined)}
          />
        )}
        {filters.maxTramer !== undefined && (
          <FilterTag
            label={`Max ${filters.maxTramer.toLocaleString("tr-TR")} TL tramer`}
            onRemove={() => applyInstantFilterChange("maxTramer", undefined)}
          />
        )}
        {filters.query && (
          <FilterTag
            label={`"${filters.query}"`}
            onRemove={() => applyInstantFilterChange("query", undefined)}
          />
        )}
        {filters.hasExpertReport && (
          <FilterTag
            label="Ekspertizli"
            onRemove={() => applyInstantFilterChange("hasExpertReport", undefined)}
          />
        )}
      </div>
    </div>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="group flex items-center gap-2 rounded-xl border border-border bg-background pl-3 pr-1.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground shadow-sm transition-all hover:border-foreground/30">
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
