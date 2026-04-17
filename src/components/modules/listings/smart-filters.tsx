"use client"

import { useState } from "react"
import { Filter, ChevronDown, Search, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ListingFilters } from "@/types"
import type { BrandCatalogItem, CityOption } from "@/types"
import Link from "next/link"

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
  { value: "hibrit", label: "Hibrit" },
  { value: "elektrik", label: "Elektrik" },
  { value: "lpg", label: "LPG" },
]

const TRANSMISSION_OPTIONS = [
  { value: "manuel", label: "Manuel" },
  { value: "otomatik", label: "Otomatik" },
  { value: "yari_otomatik", label: "Yarı Otomatik" },
]

const CURRENT_YEAR = 2026 // Updated annually — avoids hydration mismatch from new Date() in client components

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
  const [openSections, setOpenSections] = useState<string[]>(["brand", "city", "price", "year", "fuel"])

  const toggleSection = (id: string) => {
    setOpenSections(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="text-base font-bold flex items-center gap-2 text-gray-800">
          <Filter size={16} className="text-blue-500" /> Filtrele
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center size-5 rounded-full bg-blue-500 text-white text-[10px] font-black">
              {activeCount}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={onReset}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium"
            >
              Sıfırla
            </button>
          )}
          <Link
            href="/listings/filter"
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-medium border border-blue-100 bg-blue-50 px-2 py-1 rounded-lg transition"
          >
            <SlidersHorizontal size={12} />
            Gelişmiş
          </Link>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Brand & Model */}
        <FilterSection
          title="Marka & Model"
          isOpen={openSections.includes("brand")}
          onToggle={() => toggleSection("brand")}
        >
          <div className="space-y-2.5">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-2.5 text-gray-400" />
              <select
                value={filters.brand ?? ""}
                onChange={(e) => onFilterChange("brand", e.target.value || undefined)}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-2 text-sm focus:border-blue-500 outline-none"
              >
                <option value="">Tüm Markalar</option>
                {brands.map((b) => (
                  <option key={b.brand} value={b.brand}>{b.brand}</option>
                ))}
              </select>
            </div>

            <select
              value={filters.model ?? ""}
              onChange={(e) => onFilterChange("model", e.target.value || undefined)}
              disabled={!filters.brand}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <option value="">Tüm Modeller</option>
              {models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>

            <select
              value={filters.carTrim ?? ""}
              onChange={(e) => onFilterChange("carTrim", e.target.value || undefined)}
              disabled={!filters.model}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <option value="">Tüm Paketler</option>
              {trims.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </FilterSection>

        <Divider />

        {/* City & District */}
        <FilterSection
          title="Şehir & İlçe"
          isOpen={openSections.includes("city")}
          onToggle={() => toggleSection("city")}
        >
          <div className="space-y-2.5">
            <select
              value={filters.city ?? ""}
              onChange={(e) => onFilterChange("city", e.target.value || undefined)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 outline-none"
            >
              <option value="">Tüm Şehirler</option>
              {cities.map((c) => <option key={c.city} value={c.city}>{c.city}</option>)}
            </select>

            <select
              value={filters.district ?? ""}
              onChange={(e) => onFilterChange("district", e.target.value || undefined)}
              disabled={!filters.city}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <option value="">Tüm İlçeler</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </FilterSection>

        <Divider />

        {/* Price */}
        <FilterSection
          title="Fiyat (TL)"
          isOpen={openSections.includes("price")}
          onToggle={() => toggleSection("price")}
        >
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice ?? ""}
              onChange={(e) => onFilterChange("minPrice", e.target.value ? Number(e.target.value) : undefined)}
              className="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
            />
            <span className="text-gray-400 text-sm">—</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice ?? ""}
              onChange={(e) => onFilterChange("maxPrice", e.target.value ? Number(e.target.value) : undefined)}
              className="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
            />
          </div>
        </FilterSection>

        <Divider />

        {/* Year */}
        <FilterSection
          title="Model Yılı"
          isOpen={openSections.includes("year")}
          onToggle={() => toggleSection("year")}
        >
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              min={1990}
              max={CURRENT_YEAR}
              value={filters.minYear ?? ""}
              onChange={(e) => onFilterChange("minYear", e.target.value ? Number(e.target.value) : undefined)}
              className="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
            />
            <span className="text-gray-400 text-sm">—</span>
            <input
              type="number"
              placeholder="Max"
              min={1990}
              max={CURRENT_YEAR}
              value={filters.maxYear ?? ""}
              onChange={(e) => onFilterChange("maxYear", e.target.value ? Number(e.target.value) : undefined)}
              className="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
            />
          </div>
        </FilterSection>

        <Divider />

        {/* Mileage */}
        <FilterSection
          title="Kilometre"
          isOpen={openSections.includes("mileage")}
          onToggle={() => toggleSection("mileage")}
        >
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Maks. Kilometre"
              value={filters.maxMileage ?? ""}
              onChange={(e) => onFilterChange("maxMileage", e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {[50000, 100000, 150000, 200000].map((km) => (
                <button
                  key={km}
                  onClick={() => onFilterChange("maxMileage", filters.maxMileage === km ? undefined : km)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium border transition",
                    filters.maxMileage === km
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                  )}
                >
                  {km >= 1000 ? `${km / 1000}K` : km}
                </button>
              ))}
            </div>
          </div>
        </FilterSection>

        <Divider />

        {/* Fuel */}
        <FilterSection
          title="Yakıt Tipi"
          isOpen={openSections.includes("fuel")}
          onToggle={() => toggleSection("fuel")}
        >
          <div className="space-y-2">
            {FUEL_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm group">
                <input
                  type="checkbox"
                  checked={filters.fuelType === opt.value}
                  onChange={() => onFilterChange("fuelType", filters.fuelType === opt.value ? undefined : opt.value as ListingFilters["fuelType"])}
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 size-4"
                />
                <span className={cn(
                  "transition-colors",
                  filters.fuelType === opt.value ? "font-bold text-blue-600" : "text-gray-600 group-hover:text-gray-900"
                )}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        <Divider />

        {/* Transmission */}
        <FilterSection
          title="Vites"
          isOpen={openSections.includes("gearbox")}
          onToggle={() => toggleSection("gearbox")}
        >
          <div className="space-y-2">
            {TRANSMISSION_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm group">
                <input
                  type="checkbox"
                  checked={filters.transmission === opt.value}
                  onChange={() => onFilterChange("transmission", filters.transmission === opt.value ? undefined : opt.value)}
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 size-4"
                />
                <span className={cn(
                  "transition-colors",
                  filters.transmission === opt.value ? "font-bold text-blue-600" : "text-gray-600 group-hover:text-gray-900"
                )}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        <Divider />

        {/* Trust */}
        <FilterSection
          title="Ekspertiz & Hasar"
          isOpen={openSections.includes("trust")}
          onToggle={() => toggleSection("trust")}
        >
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm group">
              <input
                type="checkbox"
                checked={filters.hasExpertReport === true}
                onChange={() => onFilterChange("hasExpertReport", filters.hasExpertReport ? undefined : true)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 size-4"
              />
              <span className={cn(
                "transition-colors",
                filters.hasExpertReport ? "font-bold text-blue-600" : "text-gray-600 group-hover:text-gray-900"
              )}>
                Ekspertiz raporlu
              </span>
            </label>
            <input
              type="number"
              min={0}
              placeholder="Maks. Tramer Tutarı (TL)"
              value={filters.maxTramer ?? ""}
              onChange={(e) => onFilterChange("maxTramer", e.target.value ? Number(e.target.value) : undefined)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 outline-none"
            />
          </div>
        </FilterSection>
      </div>
    </div>
  )
}

function FilterSection({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between text-sm font-bold text-gray-800 hover:text-blue-500 transition-colors mb-3"
      >
        {title}
        <ChevronDown
          size={14}
          className={cn("text-gray-400 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>
      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}

function Divider() {
  return <hr className="border-gray-100" />
}
