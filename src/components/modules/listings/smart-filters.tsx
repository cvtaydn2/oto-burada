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
    <div className="flex flex-col gap-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
               <SlidersHorizontal size={18} />
            </div>
            <div className="flex flex-col">
               <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 italic">Tercihler</h3>
               <span className="text-lg font-black font-heading leading-none">Filtreleme</span>
            </div>
            {activeCount > 0 && (
              <span className="size-5 rounded-full bg-primary text-[10px] font-black text-white flex items-center justify-center shadow-lg shadow-primary/20">
                 {activeCount}
              </span>
            )}
         </div>
         {activeCount > 0 && (
           <button 
             onClick={onReset}
             className="text-[11px] font-black text-slate-400 hover:text-primary uppercase tracking-widest italic transition-colors"
           >
             Sıfırla
           </button>
         )}
      </div>

      <div className="space-y-2">
        {/* Brand Section */}
        <FilterGroup 
          title="Marka ve Model" 
          isOpen={expandedSections.includes("brand")} 
          onToggle={() => toggleSection("brand")}
        >
          <div className="space-y-3">
            <FilterSelect
              value={filters.brand || "all"}
              onValueChange={(v) => onFilterChange("brand", v === "all" ? undefined : v)}
              placeholder="Marka seç"
              options={brandOptions}
              className="bg-slate-50 border-none rounded-2xl h-12 text-sm font-bold"
            />
            {filters.brand && (
              <FilterSelect
                value={filters.model || "all"}
                onValueChange={(v) => {
                  onFilterChange("model", v === "all" ? undefined : v);
                  onFilterChange("carTrim", undefined);
                }}
                placeholder="Model seç"
                options={modelOptions}
                className="bg-slate-50 border-none rounded-2xl h-12 text-sm font-bold animate-in fade-in slide-in-from-top-2"
              />
            )}
            {filters.model && trims.length > 0 && (
              <FilterSelect
                value={filters.carTrim || "all"}
                onValueChange={(v) => onFilterChange("carTrim", v === "all" ? undefined : v)}
                placeholder="Paket seç"
                options={trimOptions}
                className="bg-slate-50 border-none rounded-2xl h-12 text-sm font-bold animate-in fade-in slide-in-from-top-2"
              />
            )}
          </div>
        </FilterGroup>

        {/* Price Section */}
        <FilterGroup 
          title="Fiyat Aralığı" 
          isOpen={expandedSections.includes("price")} 
          onToggle={() => toggleSection("price")}
        >
          <div className="space-y-6 pt-2">
             <RangeSlider
                min={0}
                max={15_000_000}
                step={10_000}
                valueMin={filters.minPrice}
                valueMax={filters.maxPrice}
                onChangeMin={(v) => onFilterChange("minPrice", v)}
                onChangeMax={(v) => onFilterChange("maxPrice", v)}
                formatLabel={v => {
                  if (v >= 1_000_000) return `₺${(v/1_000_000).toFixed(1)}M`
                  return `₺${(v/1000).toFixed(0)}k`
                }}
             />
             <div className="grid grid-cols-2 gap-3">
                <PriceInput label="Min" value={filters.minPrice} onChange={(v) => onFilterChange("minPrice", v)} />
                <PriceInput label="Max" value={filters.maxPrice} onChange={(v) => onFilterChange("maxPrice", v)} />
             </div>
          </div>
        </FilterGroup>

        {/* Dynamic Specs Section */}
        <FilterGroup title="Donanım ve Özellikler" isOpen={expandedSections.includes("specs")} onToggle={() => toggleSection("specs")}>
           <div className="space-y-6">
              <div>
                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block italic">Vites Tipi</span>
                 <div className="grid grid-cols-2 gap-2">
                    {(["otomatik", "manuel"] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => onFilterChange("transmission", filters.transmission === type ? undefined : type)}
                        className={cn(
                          "h-11 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest italic",
                          filters.transmission === type 
                            ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10" 
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                        )}
                      >
                         {type}
                      </button>
                    ))}
                 </div>
              </div>
              <div>
                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block italic">Yakıt Tipi</span>
                 <div className="grid grid-cols-2 gap-2">
                    {(["benzin", "dizel", "elektrik", "hibrit"] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => onFilterChange("fuelType", filters.fuelType === type ? undefined : type)}
                        className={cn(
                          "h-11 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest italic",
                          filters.fuelType === type 
                            ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10" 
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                        )}
                      >
                         {type}
                      </button>
                    ))}
                 </div>
              </div>
           </div>
        </FilterGroup>

        {/* Trust & Damage Section */}
        <FilterGroup title="Güven ve Durum" isOpen={expandedSections.includes("trust")} onToggle={() => toggleSection("trust")}>
           <div className="space-y-6 pt-2">
              <button 
                onClick={() => onFilterChange("hasExpertReport", filters.hasExpertReport ? undefined : true)}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                  filters.hasExpertReport 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-700 active-ring" 
                    : "bg-slate-50 border-transparent text-slate-500"
                )}
              >
                <span className="text-xs font-black uppercase tracking-widest italic">Ekspertizli İlanlar</span>
                <div className={cn(
                  "size-5 rounded-full border-2 flex items-center justify-center transition-all",
                  filters.hasExpertReport ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
                )}>
                  {filters.hasExpertReport && <div className="size-2 rounded-full bg-white" />}
                </div>
              </button>

              <div>
                 <div className="flex items-center justify-between mb-2">
                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Max Tramer</span>
                   <span className="text-xs font-black text-slate-900 font-heading">₺{filters.maxTramer ? (filters.maxTramer/1000).toFixed(0) + 'k' : 'Sınırsız'}</span>
                 </div>
                 <RangeSlider
                   min={0}
                   max={200_000}
                   step={5000}
                   valueMin={0}
                   valueMax={filters.maxTramer}
                   onChangeMin={() => {}}
                   onChangeMax={(v) => onFilterChange("maxTramer", v)}
                   formatLabel={v => v === 0 ? "Orijinal" : `₺${(v/1000).toFixed(0)}k`}
                 />
              </div>
           </div>
        </FilterGroup>
      </div>
    </div>
  )
}

function FilterGroup({ title, children, isOpen, onToggle }: { title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="group border-b border-slate-50 last:border-0 pb-4">
       <button 
         onClick={onToggle}
         className="w-full flex items-center justify-between py-4 text-[13px] font-black italic uppercase tracking-widest text-slate-900"
       >
          <span className="group-hover:text-primary transition-colors">{title}</span>
          <ChevronDown className={cn("text-slate-300 transition-transform duration-500", isOpen && "rotate-180 text-primary")} size={18} />
       </button>
       {isOpen && (
         <div className="pb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            {children}
         </div>
       )}
    </div>
  )
}

function PriceInput({ label, value, onChange }: { label: string; value?: number; onChange: (v?: number) => void }) {
  return (
    <div className="relative group">
       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest group-focus-within:text-primary transition-colors">
          {label}
       </span>
       <input 
         type="number" 
         placeholder="0"
         value={value || ""} 
         onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
         className="w-full h-12 pl-14 pr-4 rounded-2xl bg-slate-50 border-none text-sm font-black focus:ring-4 focus:ring-primary/5 transition-all outline-none"
       />
    </div>
  )
}
