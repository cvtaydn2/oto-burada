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
  filters,
  onFilterChange,
  onReset,
  activeCount
}: SmartFiltersProps) {
  const [openSections, setOpenSections] = useState<string[]>(["brand", "price", "fuel"])

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
        {/* Search Brand */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Marka ara..." 
            className="w-full border border-gray-200 rounded-lg pl-9 p-2 text-sm focus:border-blue-500 outline-none transition-colors"
          />
        </div>

        {/* Brand & Model Section */}
        <FilterSection 
          title="Marka & Model" 
          isOpen={openSections.includes("brand")} 
          onToggle={() => toggleSection("brand")}
        >
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {brands.slice(0, 8).map((b) => (
              <label key={b.brand} className="flex items-center space-x-2 cursor-pointer text-sm group">
                <input 
                  type="checkbox" 
                  checked={filters.brand === b.brand}
                  onChange={() => onFilterChange("brand", filters.brand === b.brand ? undefined : b.brand)}
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 size-4 transition"
                />
                <span className={cn("transition-colors", filters.brand === b.brand ? "font-bold text-blue-600" : "text-gray-600 group-hover:text-gray-900")}>
                  {b.brand}
                </span>
              </label>
            ))}
            {brands.length > 8 && (
              <button className="text-blue-500 text-xs font-bold mt-2 hover:underline">+ {brands.length - 8} Marka Daha</button>
            )}
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
