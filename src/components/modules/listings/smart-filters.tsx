"use client"

import { useState } from "react"
import { SlidersHorizontal, ChevronDown, MapPin, Settings2, Gauge } from "lucide-react"
import { cn } from "@/lib/utils"
import { RangeSlider } from "@/components/ui/range-slider"
import { FilterSelect } from "@/components/listings/filter-select"
import type { ListingFilters } from "@/types"
import type { BrandCatalogItem, CityOption } from "@/types"

interface SmartFiltersProps {
  brands: BrandCatalogItem[]
  cities: CityOption[]
  filters: ListingFilters
  models: string[]
  trims: string[]
  districts: string[]
  onFilterChange: <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => void
  onReset: () => void
  activeCount: number
}

const FUEL_OPTIONS = [
  { value: "benzin", label: "Benzin" },
  { value: "dizel", label: "Dizel" },
  { value: "lpg", label: "LPG" },
  { value: "hibrit", label: "Hibrit" },
  { value: "elektrik", label: "Elektrik" },
]

const TRANSMISSION_OPTIONS = [
  { value: "otomatik", label: "Otomatik" },
  { value: "manuel", label: "Manuel" },
  { value: "yari_otomatik", label: "Yarı Otomatik" },
]

export function SmartFilters({
  brands,
  cities,
  filters,
  models,
  trims,
  districts,
  onFilterChange,
  onReset,
  activeCount
}: SmartFiltersProps) {
  const [openSections, setOpenSections] = useState<string[]>(["brand", "price"])

  const toggleSection = (id: string) => {
    setOpenSections(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const brandOptions = [{ value: "all", label: "Tüm Markalar" }, ...brands.map(b => ({ value: b.brand, label: b.brand }))]
  const modelOptions = [{ value: "all", label: "Tüm Modeller" }, ...models.map(m => ({ value: m, label: m }))]
  const trimOptions = [{ value: "all", label: "Tüm Paketler" }, ...trims.map(t => ({ value: t, label: t }))]
  const cityOptions = [{ value: "all", label: "Tüm Şehirler" }, ...cities.map(c => ({ value: c.city, label: c.city }))]
  const districtOptions = [{ value: "all", label: "Tüm İlçeler" }, ...districts.map(d => ({ value: d, label: d }))]

  const yearCount = (filters.minYear ? 1 : 0) + (filters.maxYear ? 1 : 0)

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-gray-800" />
          <h3 className="text-lg font-bold text-gray-800">Filtrele</h3>
          {activeCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Sıfırla
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-50 px-5 pb-5">
        {/* Marka & Model */}
        <FilterGroup
          title="Marka & Model"
          isOpen={openSections.includes("brand")}
          onToggle={() => toggleSection("brand")}
          activeCount={filters.brand ? 1 : 0}
        >
          <div className="space-y-2 pt-1">
            <FilterSelect
              value={filters.brand || "all"}
              onValueChange={(v) => {
                onFilterChange("brand", v === "all" ? undefined : v)
                onFilterChange("model", undefined)
                onFilterChange("carTrim", undefined)
              }}
              placeholder="Marka seç"
              options={brandOptions}
            />
            {filters.brand && models.length > 0 && (
              <FilterSelect
                value={filters.model || "all"}
                onValueChange={(v) => {
                  onFilterChange("model", v === "all" ? undefined : v)
                  onFilterChange("carTrim", undefined)
                }}
                placeholder="Model seç"
                options={modelOptions}
              />
            )}
            {filters.model && trims.length > 0 && (
              <FilterSelect
                value={filters.carTrim || "all"}
                onValueChange={(v) => onFilterChange("carTrim", v === "all" ? undefined : v)}
                placeholder="Paket seç"
                options={trimOptions}
              />
            )}
          </div>
        </FilterGroup>

        {/* Fiyat */}
        <FilterGroup
          title="Fiyat Aralığı"
          isOpen={openSections.includes("price")}
          onToggle={() => toggleSection("price")}
          activeCount={(filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0)}
        >
          <div className="space-y-3 pt-1">
            <RangeSlider
              min={0}
              max={15_000_000}
              step={50_000}
              valueMin={filters.minPrice}
              valueMax={filters.maxPrice}
              onChangeMin={(v) => onFilterChange("minPrice", v)}
              onChangeMax={(v) => onFilterChange("maxPrice", v)}
              formatLabel={(v) => {
                if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M TL`
                return `${(v / 1000).toFixed(0)}K TL`
              }}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min TL"
                value={filters.minPrice ?? ""}
                onChange={(e) => onFilterChange("minPrice", e.target.value ? Number(e.target.value) : undefined)}
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-slate-400"
              />
              <input
                type="number"
                placeholder="Max TL"
                value={filters.maxPrice ?? ""}
                onChange={(e) => onFilterChange("maxPrice", e.target.value ? Number(e.target.value) : undefined)}
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-slate-400"
              />
            </div>
          </div>
        </FilterGroup>

        {/* Yıl */}
        <FilterGroup
          title="Model Yılı"
          isOpen={openSections.includes("year")}
          onToggle={() => toggleSection("year")}
          activeCount={yearCount}
        >
          <div className="grid grid-cols-2 gap-2 pt-1">
            <input
              type="number"
              placeholder="Min yıl"
              value={filters.minYear ?? ""}
              onChange={(e) => onFilterChange("minYear", e.target.value ? Number(e.target.value) : undefined)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-slate-400"
            />
            <input
              type="number"
              placeholder="Max yıl"
              value={filters.maxYear ?? ""}
              onChange={(e) => onFilterChange("maxYear", e.target.value ? Number(e.target.value) : undefined)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-slate-400"
            />
          </div>
        </FilterGroup>

        {/* Şehir */}
        <FilterGroup
          title="Şehir"
          icon={MapPin}
          isOpen={openSections.includes("city")}
          onToggle={() => toggleSection("city")}
          activeCount={filters.city ? 1 : 0}
        >
          <div className="space-y-2 pt-1">
            <FilterSelect
              value={filters.city || "all"}
              onValueChange={(v) => {
                onFilterChange("city", v === "all" ? undefined : v)
                onFilterChange("district", undefined)
              }}
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
          </div>
        </FilterGroup>

        {/* Kilometre */}
        <FilterGroup
          title="Kilometre"
          icon={Gauge}
          isOpen={openSections.includes("mileage")}
          onToggle={() => toggleSection("mileage")}
          activeCount={filters.maxMileage ? 1 : 0}
        >
          <div className="pt-1">
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
        </FilterGroup>

        {/* Yakıt Türü */}
        <FilterGroup
          title="Yakıt Türü"
          icon={Settings2}
          isOpen={openSections.includes("fuel")}
          onToggle={() => toggleSection("fuel")}
          activeCount={filters.fuelType ? 1 : 0}
        >
          <div className="flex flex-wrap gap-2 pt-1">
            {FUEL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onFilterChange("fuelType", filters.fuelType === opt.value ? undefined : opt.value as ListingFilters["fuelType"])}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  filters.fuelType === opt.value
                    ? "border-primary bg-primary text-white"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </FilterGroup>

        {/* Vites Tipi */}
        <FilterGroup
          title="Vites"
          isOpen={openSections.includes("transmission")}
          onToggle={() => toggleSection("transmission")}
          activeCount={filters.transmission ? 1 : 0}
        >
          <div className="flex flex-wrap gap-2 pt-1">
            {TRANSMISSION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onFilterChange("transmission", filters.transmission === opt.value ? undefined : opt.value as ListingFilters["transmission"])}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  filters.transmission === opt.value
                    ? "border-primary bg-primary text-white"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </FilterGroup>
      </div>
    </div>
  )
}

interface FilterGroupProps {
  title: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
  isOpen: boolean
  onToggle: () => void
  activeCount?: number
  children: React.ReactNode
}

function FilterGroup({ title, icon: Icon, isOpen, onToggle, activeCount, children }: FilterGroupProps) {
  return (
    <div className="py-4">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between group"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
          {Icon && <Icon size={13} className={activeCount && activeCount > 0 ? "text-primary" : "text-slate-400"} />}
          {title}
          {activeCount !== undefined && activeCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown
          size={13}
          className={cn(
            "text-slate-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  )
}
