"use client"

import { useState } from "react"
import { SlidersHorizontal, ChevronDown } from "lucide-react"
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
  const [expandedSections, setExpandedSections] = useState<string[]>(["brand", "price"])

  const toggleSection = (id: string) => {
    setExpandedSections(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const brandOptions = [{ value: "all", label: "Tüm Markalar" }, ...brands.map(b => ({ value: b.brand, label: b.brand }))]
  const modelOptions = [{ value: "all", label: "Tüm Modeller" }, ...models.map(m => ({ value: m, label: m }))]
  const trimOptions = [{ value: "all", label: "Tüm Paketler" }, ...trims.map(t => ({ value: t, label: t }))]
  
  return (
    <div className="flex flex-col gap-6">
      {/* Active Filters Summary (Desktop Only if we want) */}
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
            <h3 className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
               <SlidersHorizontal size={14} className="text-primary" />
               Filtreler
            </h3>
            {activeCount > 0 && (
              <span className="h-5 px-2 rounded bg-primary text-[11px] font-black text-white flex items-center justify-center">
                 {activeCount}
              </span>
            )}
         </div>
         {activeCount > 0 && (
           <button 
             onClick={onReset}
             className="text-xs font-black text-primary hover:underline uppercase tracking-tighter italic"
           >
             Sıfırla
           </button>
         )}
      </div>

      {/* Modern High-Density Filter Sections */}
      <div className="space-y-4">
        
        {/* Brand & Model Section */}
        <FilterGroup 
          title="Marka & Model" 
          isOpen={expandedSections.includes("brand")} 
          onToggle={() => toggleSection("brand")}
        >
          <div className="space-y-3">
            <FilterSelect
              value={filters.brand || "all"}
              onValueChange={(v) => onFilterChange("brand", v === "all" ? undefined : v)}
              placeholder="Marka seç"
              options={brandOptions}
              className="bg-white rounded-xl border-border"
            />
            {filters.brand && models.length > 0 && (
              <FilterSelect
                value={filters.model || "all"}
                onValueChange={(v) => {
                  onFilterChange("model", v === "all" ? undefined : v);
                  onFilterChange("carTrim", undefined); // Reset trim when model changes
                }}
                placeholder="Model seç"
                options={modelOptions}
                className="bg-white rounded-xl border-border animate-in fade-in slide-in-from-top-2"
              />
            )}
            {filters.model && trims.length > 0 && (
              <FilterSelect
                value={filters.carTrim || "all"}
                onValueChange={(v) => onFilterChange("carTrim", v === "all" ? undefined : v)}
                placeholder="Paket seç"
                options={trimOptions}
                className="bg-white rounded-xl border-border animate-in fade-in slide-in-from-top-2"
              />
            )}
          </div>
        </FilterGroup>

        {/* Price Section */}
        <FilterGroup 
          title="Fiyat" 
          isOpen={expandedSections.includes("price")} 
          onToggle={() => toggleSection("price")}
        >
          <div className="space-y-6 pt-2">
             <RangeSlider
                min={0}
                max={15_000_000}
                step={50_000}
                valueMin={filters.minPrice}
                valueMax={filters.maxPrice}
                onChangeMin={(v) => onFilterChange("minPrice", v)}
                onChangeMax={(v) => onFilterChange("maxPrice", v)}
                formatLabel={v => `₺${(v / 1000).toFixed(0)}k`}
             />
             <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Min</span>
                   <input 
                     type="number" 
                     value={filters.minPrice || ""} 
                     onChange={(e) => onFilterChange("minPrice", e.target.value ? Number(e.target.value) : undefined)}
                     className="w-full h-11 pl-12 pr-4 rounded-xl border border-border bg-white text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                   />
                </div>
                <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Max</span>
                   <input 
                     type="number" 
                     value={filters.maxPrice || ""} 
                     onChange={(e) => onFilterChange("maxPrice", e.target.value ? Number(e.target.value) : undefined)}
                     className="w-full h-11 pl-12 pr-4 rounded-xl border border-border bg-white text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                   />
                </div>
             </div>
          </div>
        </FilterGroup>

        {/* Transmission & Fuel (Quick Selection Tabs) */}
        <FilterGroup title="Vites & Yakıt" isOpen={expandedSections.includes("specs")} onToggle={() => toggleSection("specs")}>
           <div className="space-y-4">
              <div>
                 <span className="text-[11px] font-black uppercase text-muted-foreground tracking-widest mb-2 block">Vites</span>
                 <div className="flex flex-wrap gap-2">
                    {(["otomatik", "manuel"] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => onFilterChange("transmission", filters.transmission === type ? undefined : type)}
                        className={cn(
                          "flex-1 h-9 rounded-lg text-xs font-black uppercase transition-all tracking-tighter italic",
                          filters.transmission === type 
                            ? "bg-primary text-white shadow-lg shadow-primary/25" 
                            : "bg-white border border-border text-slate-600 hover:bg-slate-50"
                        )}
                      >
                         {type}
                      </button>
                    ))}
                 </div>
              </div>
              <div>
                 <span className="text-[11px] font-black uppercase text-muted-foreground tracking-widest mb-2 block">Yakıt</span>
                 <div className="grid grid-cols-2 gap-2">
                    {(["benzin", "dizel", "elektrik", "hibrit"] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => onFilterChange("fuelType", filters.fuelType === type ? undefined : type)}
                        className={cn(
                          "h-9 rounded-lg text-xs font-black uppercase transition-all tracking-tighter italic",
                          filters.fuelType === type 
                            ? "bg-primary text-white shadow-lg shadow-primary/25" 
                            : "bg-white border border-border text-slate-600 hover:bg-slate-50"
                        )}
                      >
                         {type}
                      </button>
                    ))}
                 </div>
              </div>
           </div>
        </FilterGroup>

        {/* Year Section */}
        <FilterGroup title="Yıl & KM" isOpen={expandedSections.includes("year")} onToggle={() => toggleSection("year")}>
           <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-2">
                 <input 
                   type="number" 
                   placeholder="Min Yıl" 
                   value={filters.minYear || ""} 
                   onChange={(e) => onFilterChange("minYear", e.target.value ? Number(e.target.value) : undefined)}
                   className="w-full h-10 px-4 rounded-xl border border-border bg-white text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                 />
                 <input 
                   type="number" 
                   placeholder="Max Yıl" 
                   value={filters.maxYear || ""} 
                   onChange={(e) => onFilterChange("maxYear", e.target.value ? Number(e.target.value) : undefined)}
                   className="w-full h-10 px-4 rounded-xl border border-border bg-white text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                 />
              </div>
              <div>
                 <RangeSlider
                   min={0}
                   max={500_000}
                   step={10_000}
                   valueMin={0}
                   valueMax={filters.maxMileage}
                   onChangeMin={() => {}}
                   onChangeMax={(v) => onFilterChange("maxMileage", v)}
                   formatLabel={v => `${(v/1000).toFixed(0)}k km`}
                 />
              </div>
           </div>
        </FilterGroup>
      </div>

      {/* Floating Action for Mobile (If we use it inside a drawer) */}
    </div>
  )
}

function FilterGroup({ title, children, isOpen, onToggle }: { title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-slate-100 last:border-0 pb-4">
       <button 
         onClick={onToggle}
         className="w-full flex items-center justify-between py-2 text-sm font-black italic uppercase tracking-tighter text-foreground group"
       >
          <span className="group-hover:text-primary transition-colors">{title}</span>
          <ChevronDown className={cn("text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} size={16} />
       </button>
       {isOpen && (
         <div className="mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {children}
         </div>
       )}
    </div>
  )
}
