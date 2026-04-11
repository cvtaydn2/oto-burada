"use client";

import { useState, useMemo, type ChangeEvent } from "react";
import { fuelTypes, listingSortOptions, maximumCarYear, minimumCarYear, transmissionTypes } from "@/lib/constants/domain";
import { SlidersHorizontal, ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { RangeSlider } from "@/components/ui/range-slider";
import type { ListingFilters, ListingSortOption } from "@/types";
import type { BrandCatalogItem, CityOption } from "@/types";

interface QuickPreset {
  description: string;
  id: string;
  label: string;
}

interface ListingsFilterPanelProps {
  brands: BrandCatalogItem[];
  cities: CityOption[];
  filters: ListingFilters;
  models: string[];
  districts: string[];
  isMobile?: boolean;
  quickPresets?: QuickPreset[];
  onApplyPreset?: (presetId: string) => void;
  onFilterChange: <K extends keyof ListingFilters>(
    key: K,
    value: ListingFilters[K],
  ) => void;
  onReset: () => void;
  disabled?: boolean;
}

const sortLabels: Record<ListingSortOption, string> = {
  newest: "En yeni",
  price_asc: "Fiyat artan",
  price_desc: "Fiyat azalan",
  mileage_asc: "KM düşük",
  year_desc: "Model yılı yeni",
};

const PRICE_MIN = 0;
const PRICE_MAX = 10_000_000;
const PRICE_STEP = 25_000;
const MILEAGE_MIN = 0;
const MILEAGE_MAX = 500_000;
const MILEAGE_STEP = 5_000;

interface FilterSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  activeCount?: number;
  disabled?: boolean;
}

function FilterSection({ title, defaultOpen = true, children, activeCount, disabled }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex w-full items-center justify-between py-3 text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="flex items-center gap-2">
          {title}
          {activeCount !== undefined && activeCount > 0 && (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
              {activeCount}
            </span>
          )}
        </span>
        {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </button>
      {isOpen && <div className="pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function formatPrice(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(".0", "")}M TL`;
  }
  return `${(value / 1_000).toFixed(0)}K TL`;
}

function formatMileage(value: number) {
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K km`;
  }
  return `${value} km`;
}

export function ListingsFilterPanel({
  brands,
  cities,
  filters,
  models,
  districts,
  isMobile = false,
  quickPresets = [],
  onApplyPreset,
  onFilterChange,
  onReset,
  disabled = false,
}: ListingsFilterPanelProps) {
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.query) count++;
    if (filters.brand) count++;
    if (filters.model) count++;
    if (filters.city) count++;
    if (filters.district) count++;
    if (filters.fuelType) count++;
    if (filters.transmission) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.minYear || filters.maxYear) count++;
    if (filters.maxMileage) count++;
    return count;
  }, [filters]);

  const brandCount = filters.brand ? 1 : 0;
  const locationCount = (filters.city ? 1 : 0) + (filters.district ? 1 : 0);
  const specsCount = (filters.fuelType ? 1 : 0) + (filters.transmission ? 1 : 0);
  const priceCount = (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0);
  const yearCount = (filters.minYear ? 1 : 0) + (filters.maxYear ? 1 : 0) + (filters.maxMileage ? 1 : 0);

  return (
    <div
      className={cn(
        "rounded-2xl bg-white border border-slate-200/60 p-5 shadow-sm",
        isMobile && "max-h-[85vh] overflow-y-auto rounded-t-2xl",
        disabled && "pointer-events-none opacity-80"
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Filtrele</h2>
            <p className="text-xs text-slate-500">
              {activeFiltersCount > 0 ? `${activeFiltersCount} aktif filtre` : "Aradığın aracı bul"}
            </p>
          </div>
        </div>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <X size={14} />
            Temizle
          </button>
        )}
      </div>

      {quickPresets.length > 0 && (
        <div className="mb-5 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
          <h3 className="text-sm font-bold text-indigo-900 mb-2">Hızlı Seçimler</h3>
          <div className="flex flex-wrap gap-2">
            {quickPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyPreset?.(preset.id)}
                className="px-3 py-1.5 bg-white rounded-full text-xs font-medium text-slate-700 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-all"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1">
        <FilterSection title="Arama">
          <div className="relative">
            <label htmlFor="filter-query" className="sr-only">İlan Ara</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="filter-query"
              value={filters.query ?? ""}
              onChange={(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onFilterChange("query", event.target.value || undefined)}
              placeholder="Marka, model veya şehir"
              className="h-10 w-full pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </FilterSection>

        <FilterSection title="Sıralama">
          <label htmlFor="filter-sort" className="sr-only">Sıralama</label>
          <select
            id="filter-sort"
            value={filters.sort ?? "newest"}
            onChange={(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onFilterChange("sort", event.target.value as ListingSortOption)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-all focus:bg-white focus:border-indigo-500"
          >
            {listingSortOptions.map((option) => (
              <option key={option} value={option}>
                {sortLabels[option]}
              </option>
            ))}
          </select>
        </FilterSection>

        <FilterSection title="Marka & Model" activeCount={brandCount}>
          <div className="space-y-3">
            <label htmlFor="filter-brand" className="sr-only">Marka</label>
            <select
              id="filter-brand"
              value={filters.brand ?? ""}
              onChange={(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onFilterChange("brand", event.target.value || undefined)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-all focus:bg-white focus:border-indigo-500"
            >
              <option value="">Tüm Markalar</option>
              {brands.map((item) => (
                <option key={item.brand} value={item.brand}>
                  {item.brand}
                </option>
              ))}
            </select>
            {filters.brand && (
              <>
                <label htmlFor="filter-model" className="sr-only">Model</label>
                <select
                  id="filter-model"
                  value={filters.model ?? ""}
                  onChange={(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onFilterChange("model", event.target.value || undefined)}
                  disabled={models.length === 0}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-all focus:bg-white focus:border-indigo-500 disabled:opacity-50"
                >
                  <option value="">Tüm Modeller</option>
                  {models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </FilterSection>

        <FilterSection title="Konum" activeCount={locationCount}>
          <div className="space-y-3">
            <label htmlFor="filter-city" className="sr-only">Şehir</label>
            <select
              id="filter-city"
              value={filters.city ?? ""}
              onChange={(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onFilterChange("city", event.target.value || undefined)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-all focus:bg-white focus:border-indigo-500"
            >
              <option value="">Tüm Şehirler</option>
              {cities.map((item) => (
                <option key={item.city} value={item.city}>
                  {item.city}
                </option>
              ))}
            </select>
            {filters.city && (
              <>
                <label htmlFor="filter-district" className="sr-only">İlçe</label>
                <select
                  id="filter-district"
                  value={filters.district ?? ""}
                  onChange={(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onFilterChange("district", event.target.value || undefined)}
                  disabled={districts.length === 0}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-all focus:bg-white focus:border-indigo-500 disabled:opacity-50"
                >
                  <option value="">Tüm İlçeler</option>
                  {districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </FilterSection>

        <FilterSection title="Özellikler" activeCount={specsCount}>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-fuel" className="sr-only">Yakıt Türü</label>
              <select
                id="filter-fuel"
                value={filters.fuelType ?? ""}
                onChange={(event) =>
                  onFilterChange("fuelType", (event.target.value || undefined) as ListingFilters["fuelType"])
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-all focus:bg-white focus:border-indigo-500"
              >
                <option value="">Yakıt Türü</option>
                {fuelTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-transmission" className="sr-only">Vites</label>
              <select
                id="filter-transmission"
                value={filters.transmission ?? ""}
                onChange={(event) =>
                  onFilterChange("transmission", (event.target.value || undefined) as ListingFilters["transmission"])
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-all focus:bg-white focus:border-indigo-500"
              >
                <option value="">Vites</option>
                {transmissionTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FilterSection>

        <FilterSection title="Fiyat Aralığı" activeCount={priceCount}>
          <RangeSlider
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            valueMin={filters.minPrice}
            valueMax={filters.maxPrice}
            onChangeMin={(v) => onFilterChange("minPrice", v)}
            onChangeMax={(v) => onFilterChange("maxPrice", v)}
            formatLabel={formatPrice}
          />
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="relative">
              <label htmlFor="filter-min-price" className="sr-only">Minimum Fiyat</label>
              <input
                id="filter-min-price"
                type="number"
                placeholder="Min"
                value={filters.minPrice ?? ""}
                onChange={(event) =>
                  onFilterChange("minPrice", event.target.value ? Number(event.target.value) : undefined)
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-8 text-sm outline-none transition-all focus:bg-white focus:border-indigo-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">TL</span>
            </div>
            <div className="relative">
              <label htmlFor="filter-max-price" className="sr-only">Maksimum Fiyat</label>
              <input
                id="filter-max-price"
                type="number"
                placeholder="Max"
                value={filters.maxPrice ?? ""}
                onChange={(event) =>
                  onFilterChange("maxPrice", event.target.value ? Number(event.target.value) : undefined)
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-8 text-sm outline-none transition-all focus:bg-white focus:border-indigo-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">TL</span>
            </div>
          </div>
        </FilterSection>

        <FilterSection title="Yıl & KM" activeCount={yearCount}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="filter-min-year" className="sr-only">Minimum Yıl</label>
                <input
                  id="filter-min-year"
                  type="number"
                  placeholder="Min Yıl"
                  min={minimumCarYear}
                  max={maximumCarYear}
                  value={filters.minYear ?? ""}
                  onChange={(event) =>
                    onFilterChange("minYear", event.target.value ? Number(event.target.value) : undefined)
                  }
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-all focus:bg-white focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="filter-max-year" className="sr-only">Maksimum Yıl</label>
                <input
                  id="filter-max-year"
                  type="number"
                  placeholder="Max Yıl"
                  min={minimumCarYear}
                  max={maximumCarYear}
                  value={filters.maxYear ?? ""}
                  onChange={(event) =>
                    onFilterChange("maxYear", event.target.value ? Number(event.target.value) : undefined)
                  }
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-all focus:bg-white focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Maksimum Kilometre</p>
              <RangeSlider
                min={MILEAGE_MIN}
                max={MILEAGE_MAX}
                step={MILEAGE_STEP}
                valueMin={MILEAGE_MIN}
                valueMax={filters.maxMileage}
                onChangeMin={() => undefined}
                onChangeMax={(v) => onFilterChange("maxMileage", v)}
                formatLabel={formatMileage}
              />
            </div>
          </div>
        </FilterSection>
      </div>
    </div>
  );
}
