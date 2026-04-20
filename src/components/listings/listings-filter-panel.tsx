"use client"

import { useState } from "react"
import { SlidersHorizontal, Search, MapPin, Gauge, Settings2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { RangeSlider } from "@/components/ui/range-slider"
import { FilterSelect } from "@/components/listings/filter-select"
import type { ListingFilters } from "@/types"
import type { BrandCatalogItem, CityOption } from "@/types"

interface QuickPreset {
  description: string
  id: string
  label: string
}

interface ListingsFilterPanelProps {
  brands: BrandCatalogItem[]
  cities: CityOption[]
  filters: ListingFilters
  models: string[]
  districts: string[]
  isMobile?: boolean
  quickPresets?: QuickPreset[]
  onApplyPreset?: (presetId: string) => void
  onFilterChange: <K extends keyof ListingFilters>(
    key: K,
    value: ListingFilters[K],
  ) => void
  onReset: () => void
  disabled?: boolean
}

function FilterSection({ 
  title, 
  icon: Icon, 
  defaultOpen = true, 
  children, 
  activeCount,
  disabled 
}: {
  title: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
  defaultOpen?: boolean
  children: React.ReactNode
  activeCount?: number
  disabled?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex w-full items-center justify-between py-3 text-sm font-medium text-foreground hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon size={16} className={activeCount && activeCount > 0 ? "text-blue-600" : "text-muted-foreground/70"} />}
          {title}
          {activeCount !== undefined && activeCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-md bg-blue-600 text-[10px] font-medium text-white">
              {activeCount}
            </span>
          )}
        </span>
        <span className={cn("text-muted-foreground/70 transition-transform", isOpen ? "rotate-180" : "")}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {isOpen && <div className="pb-4 space-y-3">{children}</div>}
    </div>
  )
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
  const brandCount = filters.brand ? 1 : 0
  const locationCount = (filters.city ? 1 : 0) + (filters.district ? 1 : 0)
  const specsCount = (filters.fuelType ? 1 : 0) + (filters.transmission ? 1 : 0)
  const priceCount = (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0)
  const yearCount = (filters.minYear ? 1 : 0) + (filters.maxYear ? 1 : 0) + (filters.maxMileage ? 1 : 0)
  const activeFiltersCount = brandCount + locationCount + specsCount + priceCount + yearCount + (filters.query ? 1 : 0)

  const brandOptions = [{ value: "all", label: "Tüm Markalar" }, ...brands.map(b => ({ value: b.brand, label: b.brand }))]
  const modelOptions = [{ value: "all", label: "Tüm Modeller" }, ...models.map(m => ({ value: m, label: m }))]
  const cityOptions = [{ value: "all", label: "Tüm Şehirler" }, ...cities.map(c => ({ value: c.city, label: c.city }))]
  const districtOptions = [{ value: "all", label: "Tüm İlçeler" }, ...districts.map(d => ({ value: d, label: d }))]

  return (
    <div className={cn(
      "bg-card border border-border shadow-sm",
      isMobile ? "rounded-t-2xl h-full" : "rounded-xl p-5 sticky top-24",
      disabled && "pointer-events-none opacity-60"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Filtrele</h2>
            <p className="text-xs text-muted-foreground">{activeFiltersCount} aktif</p>
          </div>
        </div>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="h-8 px-3 rounded-lg bg-muted text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Temizle
          </button>
        )}
      </div>

      {/* Quick Presets */}
      {quickPresets.length > 0 && (
        <div className="mb-5 p-3 bg-muted/30 rounded-lg">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Hızlı Seçimler
          </span>
          <div className="flex flex-wrap gap-2">
            {quickPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyPreset?.(preset.id)}
                className="px-2.5 py-1.5 bg-card rounded-lg text-xs font-medium text-foreground/90 border border-border hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-0.5">
        {/* Search */}
        <FilterSection title="Arama" icon={Search} defaultOpen={false} activeCount={filters.query ? 1 : 0}>
          <input
            value={filters.query ?? ""}
            onChange={(e) => onFilterChange("query", e.target.value || undefined)}
            placeholder="Marka, model..."
            className="h-10 w-full px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground outline-none focus:bg-card focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-muted-foreground/70"
          />
        </FilterSection>

        {/* Brand & Model */}
        <FilterSection title="Marka" icon={undefined} activeCount={brandCount}>
          <FilterSelect
            value={filters.brand || "all"}
            onValueChange={(v) => onFilterChange("brand", v === "all" ? undefined : v)}
            placeholder="Marka seç"
            options={brandOptions}
          />
          {filters.brand && models.length > 0 && (
            <FilterSelect
              value={filters.model || "all"}
              onValueChange={(v) => onFilterChange("model", v === "all" ? undefined : v)}
              placeholder="Model seç"
              options={modelOptions}
            />
          )}
        </FilterSection>

        {/* Location */}
        <FilterSection title="Konum" icon={MapPin} activeCount={locationCount}>
          <FilterSelect
            value={filters.city || "all"}
            onValueChange={(v) => onFilterChange("city", v === "all" ? undefined : v)}
            placeholder="Şehir seç"
            options={cityOptions}
          />
          {filters.city && districts.length > 0 && (
            <FilterSelect
              value={filters.district || "all"}
              onValueChange={(v) => onFilterChange("district", v === "all" ? undefined : v)}
              placeholder="İlçe seç"
              options={districtOptions}
            />
          )}
        </FilterSection>

        {/* Price */}
        <FilterSection title="Fiyat" icon={undefined} activeCount={priceCount}>
          <div className="px-1">
            <RangeSlider
              min={0}
              max={15_000_000}
              step={10_000}
              valueMin={filters.minPrice}
              valueMax={filters.maxPrice}
              onChangeMin={(v) => onFilterChange("minPrice", v)}
              onChangeMax={(v) => onFilterChange("maxPrice", v)}
              formatLabel={(v) => {
                if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M TL`
                return `${(v / 1000).toFixed(0)}K TL`
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min TL"
              value={filters.minPrice ?? ""}
              onChange={(e) => onFilterChange("minPrice", e.target.value ? Number(e.target.value) : undefined)}
              className="h-10 rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground outline-none focus:bg-card focus:border-blue-500"
            />
            <input
              type="number"
              placeholder="Max TL"
              value={filters.maxPrice ?? ""}
              onChange={(e) => onFilterChange("maxPrice", e.target.value ? Number(e.target.value) : undefined)}
              className="h-10 rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground outline-none focus:bg-card focus:border-blue-500"
            />
          </div>
        </FilterSection>

        {/* Specs (Fuel & Transmission) */}
        <FilterSection title="Özellikler" icon={Settings2} activeCount={specsCount}>
            <div className="space-y-3">
            <div>
              <span className="text-xs font-medium text-muted-foreground block mb-2">Yakıt Türü</span>
              <div className="flex flex-wrap gap-2">
                {(["benzin", "dizel", "lpg", "hibrit", "elektrik"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => onFilterChange("fuelType", filters.fuelType === type ? undefined : type)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      filters.fuelType === type 
                        ? "bg-blue-600 text-white" 
                        : "bg-muted text-muted-foreground hover:bg-slate-200"
                    )}
                  >
                    {type === "benzin" ? "Benzin" : type === "dizel" ? "Dizel" : type === "lpg" ? "LPG" : type === "hibrit" ? "Hibrit" : "Elektrik"}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <span className="text-xs font-medium text-muted-foreground block mb-2">Vites</span>
              <div className="flex flex-wrap gap-2">
                {(["otomatik", "manuel", "yari_otomatik"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => onFilterChange("transmission", filters.transmission === type ? undefined : type)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      filters.transmission === type 
                        ? "bg-blue-600 text-white" 
                        : "bg-muted text-muted-foreground hover:bg-slate-200"
                    )}
                  >
                    {type === "otomatik" ? "Otomatik" : type === "manuel" ? "Manuel" : "Yarı Otomatik"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </FilterSection>

        {/* Year & Mileage */}
        <FilterSection title="Yıl & KM" icon={Gauge} activeCount={yearCount}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min yıl"
                value={filters.minYear ?? ""}
                onChange={(e) => onFilterChange("minYear", e.target.value ? Number(e.target.value) : undefined)}
                className="h-10 rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground outline-none focus:bg-card focus:border-blue-500"
              />
              <input
                type="number"
                placeholder="Max yıl"
                value={filters.maxYear ?? ""}
                onChange={(e) => onFilterChange("maxYear", e.target.value ? Number(e.target.value) : undefined)}
                className="h-10 rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground outline-none focus:bg-card focus:border-blue-500"
              />
            </div>

            <div>
              <span className="text-xs font-medium text-muted-foreground block mb-2">Max KM</span>
              <RangeSlider
                min={0}
                max={500_000}
                step={10_000}
                valueMin={0}
                valueMax={filters.maxMileage}
                onChangeMin={() => undefined}
                onChangeMax={(v) => onFilterChange("maxMileage", v)}
                formatLabel={(v) => `${(v / 1000).toFixed(0)}K km`}
              />
            </div>
          </div>
        </FilterSection>
      </div>
    </div>
  )
}
