"use client"

import { useState } from "react"
import { Filter, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
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
  const [openSections, setOpenSections] = useState<string[]>(["brand", "city", "price", "fuel"])

  const toggleSection = (id: string) => {
    setOpenSections(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const FUEL_OPTIONS = [
    { value: "benzin", label: "Benzin" },
    { value: "dizel", label: "Dizel" },
    { value: "hibrit", label: "Hibrit" },
    { value: "elektrik", label: "Elektrik" },
  ]

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center">
          <Filter size={18} className="mr-2" /> Filtrele
        </h2>
        {activeCount > 0 && (
          <button 
            onClick={onReset}
            className="text-sm text-blue-500 hover:text-blue-600 font-medium"
          >
            Sıfırla
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-6 shadow-sm">
        {/* Brand & Model Section */}
        <FilterSection 
          title="Marka & Model" 
          isOpen={openSections.includes("brand")} 
          onToggle={() => toggleSection("brand")}
        >
          <div className="space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-gray-400" />
              <select
                value={filters.brand ?? ""}
                onChange={(e) => {
                  const nextBrand = e.target.value || undefined
                  onFilterChange("brand", nextBrand)
                  onFilterChange("model", undefined)
                  onFilterChange("carTrim", undefined)
                }}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white pl-9 p-2 text-sm focus:border-blue-500 outline-none transition-colors"
              >
                <option value="">Tüm Markalar</option>
                {brands.map((brand) => (
                  <option key={brand.brand} value={brand.brand}>{brand.brand}</option>
                ))}
              </select>
            </div>

            <select
              value={filters.model ?? ""}
              onChange={(e) => {
                const nextModel = e.target.value || undefined
                onFilterChange("model", nextModel)
                onFilterChange("carTrim", undefined)
              }}
              disabled={!filters.brand}
              className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm focus:border-blue-500 outline-none transition-colors disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">Tüm Modeller</option>
              {models.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>

            <select
              value={filters.carTrim ?? ""}
              onChange={(e) => onFilterChange("carTrim", e.target.value || undefined)}
              disabled={!filters.model}
              className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm focus:border-blue-500 outline-none transition-colors disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">Tüm Paketler</option>
              {trims.map((trim) => (
                <option key={trim} value={trim}>{trim}</option>
              ))}
            </select>
          </div>
        </FilterSection>

        <hr className="border-gray-100" />

        <FilterSection
          title="Şehir & İlçe"
          isOpen={openSections.includes("city")}
          onToggle={() => toggleSection("city")}
        >
          <div className="space-y-3">
            <select
              value={filters.city ?? ""}
              onChange={(e) => {
                const nextCity = e.target.value || undefined
                onFilterChange("city", nextCity)
                onFilterChange("district", undefined)
              }}
              className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm focus:border-blue-500 outline-none transition-colors"
            >
              <option value="">Tüm Şehirler</option>
              {cities.map((city) => (
                <option key={city.city} value={city.city}>{city.city}</option>
              ))}
            </select>

            <select
              value={filters.district ?? ""}
              onChange={(e) => onFilterChange("district", e.target.value || undefined)}
              disabled={!filters.city}
              className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm focus:border-blue-500 outline-none transition-colors disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">Tüm İlçeler</option>
              {districts.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>
        </FilterSection>

        <hr className="border-gray-100" />

        {/* Price Section */}
        <FilterSection 
          title="Fiyat (TL)" 
          isOpen={openSections.includes("price")} 
          onToggle={() => toggleSection("price")}
        >
          <div className="flex items-center space-x-2">
            <input 
              type="text" 
              placeholder="Min" 
              value={filters.minPrice ?? ""}
                onChange={(e) => onFilterChange("minPrice", e.target.value ? Number(e.target.value) : undefined)}
              className="w-1/2 border border-gray-200 rounded-lg p-2 text-sm focus:border-blue-500 outline-none transition-colors"
            />
            <span className="text-gray-400">-</span>
            <input 
              type="text" 
              placeholder="Max" 
              value={filters.maxPrice ?? ""}
                onChange={(e) => onFilterChange("maxPrice", e.target.value ? Number(e.target.value) : undefined)}
              className="w-1/2 border border-gray-200 rounded-lg p-2 text-sm focus:border-blue-500 outline-none transition-colors"
            />
          </div>
        </FilterSection>

        <hr className="border-gray-100" />

        <FilterSection
          title="Ekspertiz & Hasar"
          isOpen={openSections.includes("trust")}
          onToggle={() => toggleSection("trust")}
        >
          <div className="space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer text-sm group">
              <input
                type="checkbox"
                checked={filters.hasExpertReport === true}
                onChange={() => onFilterChange("hasExpertReport", filters.hasExpertReport ? undefined : true)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 size-4 transition"
              />
              <span className="text-gray-600 group-hover:text-gray-900">Ekspertiz raporlu ilanlar</span>
            </label>
            <input
              type="number"
              min={0}
              placeholder="Maks. Tramer Tutarı"
              value={filters.maxTramer ?? ""}
              onChange={(e) => onFilterChange("maxTramer", e.target.value ? Number(e.target.value) : undefined)}
              className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm focus:border-blue-500 outline-none transition-colors"
            />
          </div>
        </FilterSection>

        <hr className="border-gray-100" />

        {/* Fuel Type Section */}
        <FilterSection 
          title="Yakıt Tipi" 
          isOpen={openSections.includes("fuel")} 
          onToggle={() => toggleSection("fuel")}
        >
          <div className="space-y-2">
            {FUEL_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center space-x-2 cursor-pointer text-sm group">
                <input 
                  type="checkbox" 
                  checked={filters.fuelType === opt.value}
                  onChange={() => onFilterChange("fuelType", filters.fuelType === opt.value ? undefined : opt.value as ListingFilters["fuelType"])}
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 size-4 transition"
                />
                <span className={cn("transition-colors", filters.fuelType === opt.value ? "font-bold text-blue-600" : "text-gray-600 group-hover:text-gray-900")}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        <hr className="border-gray-100" />

        <FilterSection
          title="Vites"
          isOpen={openSections.includes("gearbox")}
          onToggle={() => toggleSection("gearbox")}
        >
          <div className="space-y-2">
            {[
              { value: "manuel", label: "Manuel" },
              { value: "otomatik", label: "Otomatik" },
              { value: "yari_otomatik", label: "Yarı Otomatik" },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center space-x-2 cursor-pointer text-sm group">
                <input
                  type="checkbox"
                  checked={filters.transmission === opt.value}
                  onChange={() => onFilterChange("transmission", filters.transmission === opt.value ? undefined : opt.value)}
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 size-4 transition"
                />
                <span className={cn("transition-colors", filters.transmission === opt.value ? "font-bold text-blue-600" : "text-gray-600 group-hover:text-gray-900")}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      </div>
    </div>
  )
}

function FilterSection({ title, isOpen, onToggle, children }: { title: string, isOpen: boolean, onToggle: () => void, children: React.ReactNode }) {
  return (
    <div>
      <h3 
        onClick={onToggle}
        className="font-bold text-sm mb-3 flex justify-between items-center cursor-pointer select-none text-gray-800 hover:text-blue-500 transition-colors"
      >
        {title} 
        <ChevronDown size={14} className={cn("text-gray-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </h3>
      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}
