"use client";

import { Gauge, MapPin, Search, Settings2, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { FilterFields } from "@/features/marketplace/components/filter-fields";
import { cn } from "@/features/shared/lib";
import { Button } from "@/features/ui/components/button";
import { Input } from "@/features/ui/components/input";
import type { BrandCatalogItem, CityOption, ListingFilters } from "@/types";

interface QuickPreset {
  description: string;
  id: string;
  label: string;
}

interface ListingsFilterPanelProps {
  brands: BrandCatalogItem[];
  cities: CityOption[];
  filters: ListingFilters;
  isMobile?: boolean;
  quickPresets?: QuickPreset[];
  onApplyPreset?: (presetId: string) => void;
  onFilterChange: <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => void;
  onReset: () => void;
  disabled?: boolean;
}

function FilterSection({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
  activeCount,
  disabled,
}: {
  title: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  defaultOpen?: boolean;
  children: React.ReactNode;
  activeCount?: number;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/50 last:border-0">
      <Button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between py-3 text-sm font-medium text-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="flex items-center gap-2">
          {Icon && (
            <Icon
              size={16}
              className={
                activeCount && activeCount > 0 ? "text-primary" : "text-muted-foreground/70"
              }
            />
          )}
          {title}
          {activeCount !== undefined && activeCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-md bg-primary text-[10px] font-medium text-white">
              {activeCount}
            </span>
          )}
        </span>
        <span
          className={cn(
            "text-muted-foreground/70 transition-transform",
            isOpen ? "rotate-180" : ""
          )}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </Button>
      {isOpen && <div className="pb-4 space-y-3">{children}</div>}
    </div>
  );
}

export function ListingsFilterPanel({
  brands,
  cities,
  filters,
  isMobile = false,
  onFilterChange,
  onReset,
  disabled = false,
}: ListingsFilterPanelProps) {
  const brandCount = (filters.brand ? 1 : 0) + (filters.model ? 1 : 0) + (filters.carTrim ? 1 : 0);
  const locationCount = (filters.city ? 1 : 0) + (filters.district ? 1 : 0);
  const specsCount = (filters.fuelType ? 1 : 0) + (filters.transmission ? 1 : 0);
  const priceCount = (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0);
  const yearCount =
    (filters.minYear ? 1 : 0) + (filters.maxYear ? 1 : 0) + (filters.maxMileage ? 1 : 0);
  const trustCount = (filters.hasExpertReport ? 1 : 0) + (filters.maxTramer ? 1 : 0);
  const activeFiltersCount =
    brandCount +
    locationCount +
    specsCount +
    priceCount +
    yearCount +
    trustCount +
    (filters.query ? 1 : 0);

  return (
    <div
      className={cn(
        "bg-card border border-border shadow-sm flex flex-col",
        isMobile ? "rounded-t-3xl h-full p-6" : "rounded-3xl p-6 sticky top-24",
        disabled && "pointer-events-none opacity-60"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black text-foreground uppercase tracking-widest italic leading-none">
              Filtrele
            </h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight mt-1">
              {activeFiltersCount > 0 ? `${activeFiltersCount} aktif filtre` : "Filtre yok"}
            </p>
          </div>
        </div>
        {activeFiltersCount > 0 && (
          <Button
            type="button"
            onClick={onReset}
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-colors"
          >
            TEMİZLE
          </Button>
        )}
      </div>

      <div className="space-y-1 overflow-y-auto pr-2 custom-scrollbar">
        {/* Search */}
        <FilterSection
          title="ARAMA"
          icon={Search}
          defaultOpen={false}
          activeCount={filters.query ? 1 : 0}
        >
          <Input
            value={filters.query ?? ""}
            onChange={(e) => onFilterChange("query", e.target.value || undefined)}
            placeholder="Kelime ile ara..."
            className="h-12 w-full px-4 rounded-xl border border-border/40 bg-muted/20 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-muted-foreground/30"
          />
        </FilterSection>

        {/* Brand */}
        <FilterSection title="MARKA & MODEL" icon={undefined} activeCount={brandCount}>
          <div className="space-y-2">
            <FilterFields.Brand
              brands={brands}
              value={filters.brand}
              onChange={(v) => onFilterChange("brand", v)}
              hideLabel
            />
            <FilterFields.Model
              brands={brands}
              brand={filters.brand}
              value={filters.model}
              onChange={(v) => onFilterChange("model", v)}
              hideLabel
            />
            <FilterFields.Trim
              brands={brands}
              brand={filters.brand}
              model={filters.model}
              value={filters.carTrim}
              onChange={(v) => onFilterChange("carTrim", v)}
              hideLabel
            />
          </div>
        </FilterSection>

        {/* Location */}
        <FilterSection title="KONUM" icon={MapPin} activeCount={locationCount}>
          <FilterFields.Location
            cities={cities}
            city={filters.city}
            district={filters.district}
            onCityChange={(v) => onFilterChange("city", v)}
            onDistrictChange={(v) => onFilterChange("district", v)}
            hideLabel
          />
        </FilterSection>

        {/* Price */}
        <FilterSection title="FİYAT ARALIĞI" icon={undefined} activeCount={priceCount}>
          <FilterFields.Range
            label="Fiyat"
            unit="TL"
            min={filters.minPrice}
            max={filters.maxPrice}
            onMinChange={(v) => onFilterChange("minPrice", v)}
            onMaxChange={(v) => onFilterChange("maxPrice", v)}
            minPlaceholder="Min"
            maxPlaceholder="Max"
            hideLabel
          />
        </FilterSection>

        {/* Specs */}
        <FilterSection title="TEKNİK ÖZELLİKLER" icon={Settings2} activeCount={specsCount}>
          <FilterFields.Technical
            fuelType={filters.fuelType}
            transmission={filters.transmission}
            onFuelChange={(v) => onFilterChange("fuelType", v)}
            onTransmissionChange={(v) => onFilterChange("transmission", v)}
            hideLabel
          />
        </FilterSection>

        {/* Year & KM */}
        <FilterSection title="YIL & KİLOMETRE" icon={Gauge} activeCount={yearCount}>
          <div className="space-y-4">
            <FilterFields.Range
              label="Yıl"
              unit="Yıl"
              min={filters.minYear}
              max={filters.maxYear}
              onMinChange={(v) => onFilterChange("minYear", v)}
              onMaxChange={(v) => onFilterChange("maxYear", v)}
              minPlaceholder="Min"
              maxPlaceholder="Max"
              hideLabel
            />
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                Maksimum KM
              </span>
              <Input
                type="number"
                placeholder="Örn: 150.000"
                value={filters.maxMileage ?? ""}
                onChange={(e) =>
                  onFilterChange("maxMileage", e.target.value ? Number(e.target.value) : undefined)
                }
                className="h-12 w-full px-4 rounded-xl border border-border/40 bg-muted/20 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
              />
            </div>
          </div>
        </FilterSection>

        <FilterSection title="EKSPERTİZ & TRAMER" icon={ShieldCheck} activeCount={trustCount}>
          <FilterFields.Trust
            hasExpertReport={filters.hasExpertReport}
            maxTramer={filters.maxTramer}
            onExpertReportChange={(v) => onFilterChange("hasExpertReport", v)}
            onMaxTramerChange={(v) => onFilterChange("maxTramer", v)}
            hideLabel
          />
        </FilterSection>
      </div>
    </div>
  );
}
