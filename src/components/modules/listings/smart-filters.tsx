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
    <div className="flex flex-col gap-10">
      {/* Header Section */}
      <div className="flex items-center justify-between pb-6 border-b border-border/40">
         <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
               <SlidersHorizontal size={20} />
            </div>
            <div className="flex flex-col">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic leading-none mb-1">Kriterler</h3>
               <span className="text-xl font-black font-heading tracking-tightest uppercase italic">FİLTRELEME</span>
            </div>
         </div>
         {activeCount > 0 && (
           <button 
             onClick={onReset}
             className="size-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all shadow-sm group"
             title="Sıfırla"
           >
             <span className="text-[10px] font-black uppercase italic tracking-tighter hidden group-hover:block pr-2 pl-3">Temizle</span>
             <div className="font-black text-xs">✕</div>
           </button>
         )}
      </div>

      <div className="space-y-2">
        {/* Brand Section */}
        <FilterGroup 
          title="Araç Kimliği" 
          isOpen={expandedSections.includes("brand")} 
          onToggle={() => toggleSection("brand")}
        >
          <div className="space-y-4 pt-2">
            <FilterSelect
              value={filters.brand || "all"}
              onValueChange={(v) => onFilterChange("brand", v === "all" ? undefined : v)}
              placeholder="Marka Seçimi"
              options={brandOptions}
            />
            {filters.brand && (
              <FilterSelect
                value={filters.model || "all"}
                onValueChange={(v) => {
                  onFilterChange("model", v === "all" ? undefined : v);
                  onFilterChange("carTrim", undefined);
                }}
                placeholder="Model Seçimi"
                options={modelOptions}
                className="animate-in fade-in slide-in-from-top-2"
              />
            )}
            {filters.model && trims.length > 0 && (
              <FilterSelect
                value={filters.carTrim || "all"}
                onValueChange={(v) => onFilterChange("carTrim", v === "all" ? undefined : v)}
                placeholder="Paket Seçimi"
                options={trimOptions}
                className="animate-in fade-in slide-in-from-top-2"
              />
            )}
          </div>
        </FilterGroup>

        {/* Price Section */}
        <FilterGroup 
          title="Yatırım Aralığı" 
          isOpen={expandedSections.includes("price")} 
          onToggle={() => toggleSection("price")}
        >
          <div className="space-y-8 pt-4 pb-2">
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
             <div className="grid grid-cols-2 gap-4">
                <PriceInput label="MİN" value={filters.minPrice} onChange={(v) => onFilterChange("minPrice", v)} />
                <PriceInput label="MAX" value={filters.maxPrice} onChange={(v) => onFilterChange("maxPrice", v)} />
             </div>
          </div>
        </FilterGroup>

        {/* Dynamic Specs Section */}
        <FilterGroup title="Teknik Karakter" isOpen={expandedSections.includes("specs")} onToggle={() => toggleSection("specs")}>
           <div className="space-y-8 pt-4">
              <div>
                 <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.2em] mb-4 block italic">ŞANZIMAN MİMARİSİ</span>
                 <div className="grid grid-cols-2 gap-3">
                    {(["otomatik", "manuel"] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => onFilterChange("transmission", filters.transmission === type ? undefined : type)}
                        className={cn(
                          "h-14 rounded-2xl text-[11px] font-black uppercase transition-all tracking-[0.1em] italic",
                          filters.transmission === type 
                            ? "bg-primary text-white shadow-xl shadow-primary/20" 
                            : "bg-secondary/30 text-foreground/50 hover:bg-secondary/50"
                        )}
                      >
                         {type}
                      </button>
                    ))}
                 </div>
              </div>
              <div>
                 <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.2em] mb-4 block italic">YAKIT EKOSİSTEMİ</span>
                 <div className="grid grid-cols-2 gap-3">
                    {(["benzin", "dizel", "elektrik", "hibrit"] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => onFilterChange("fuelType", filters.fuelType === type ? undefined : type)}
                        className={cn(
                          "h-14 rounded-2xl text-[11px] font-black uppercase transition-all tracking-[0.1em] italic",
                          filters.fuelType === type 
                            ? "bg-primary text-white shadow-xl shadow-primary/20" 
                            : "bg-secondary/30 text-foreground/50 hover:bg-secondary/50"
                        )}
                      >
                         {type}
                      </button>
                    ))}
                 </div>
              </div>
           </div>
        </FilterGroup>

        {/* Location Section */}
        <FilterGroup 
          title="Lokasyon" 
          isOpen={expandedSections.includes("location")} 
          onToggle={() => toggleSection("location")}
        >
          <div className="space-y-4 pt-2">
            <FilterSelect
              value={filters.city || "all"}
              onValueChange={(v) => onFilterChange("city", v === "all" ? undefined : v)}
              placeholder="Şehir Seçimi"
              options={[{ value: "all", label: "Tüm Şehirler" }, ...cities.map(c => ({ value: c.city, label: c.city }))]}
            />
            {filters.city && (
              <FilterSelect
                value={filters.district || "all"}
                onValueChange={(v) => onFilterChange("district", v === "all" ? undefined : v)}
                placeholder="İlçe Seçimi"
                options={[{ value: "all", label: "Tüm İlçer" }, ...districts.map(d => ({ value: d, label: d }))]}
                className="animate-in fade-in slide-in-from-top-2"
              />
            )}
          </div>
        </FilterGroup>

        {/* Trust & Damage Section */}
        <FilterGroup title="Showroom Güvencesi" isOpen={expandedSections.includes("trust")} onToggle={() => toggleSection("trust")}>
           <div className="space-y-8 pt-4">
              <button 
                onClick={() => onFilterChange("hasExpertReport", filters.hasExpertReport ? undefined : true)}
                className={cn(
                  "w-full flex items-center justify-between p-5 rounded-3xl border transition-all",
                  filters.hasExpertReport 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 shadow-lg shadow-emerald-500/5 ring-2 ring-emerald-500/20" 
                    : "bg-secondary/30 border-border/40 text-muted-foreground"
                )}
              >
                <div className="flex flex-col items-start">
                   <span className="text-[11px] font-black uppercase tracking-[0.1em] italic">Ekspertiz Onaylı</span>
                   <span className="text-[10px] font-bold opacity-60">Sadece raporu olan araçlar</span>
                </div>
                <div className={cn(
                  "size-6 rounded-full border-2 flex items-center justify-center transition-all",
                  filters.hasExpertReport ? "bg-emerald-500 border-emerald-500 text-white" : "border-border"
                )}>
                  {filters.hasExpertReport && <Check size={14} strokeWidth={4} />}
                </div>
              </button>

              <div className="pt-2">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.2em] italic">MAX TRAMER LİMİTİ</span>
                    <span className="text-xs font-black text-foreground italic">{filters.maxTramer ? (filters.maxTramer/1000).toFixed(0) + 'k ₺' : 'SINIRSIZ'}</span>
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
    <div className="border-b border-border/20 last:border-0 pb-2">
       <button 
         onClick={onToggle}
         className="w-full flex items-center justify-between py-6 group"
       >
          <span className="text-[12px] font-black italic uppercase tracking-[0.22em] text-foreground/60 group-hover:text-primary transition-all group-hover:pl-1">{title}</span>
          <div className={cn(
            "size-8 rounded-xl bg-secondary/50 flex items-center justify-center text-muted-foreground/30 transition-all duration-500",
            isOpen && "rotate-180 bg-primary/10 text-primary"
          )}>
             <ChevronDown size={16} strokeWidth={3} />
          </div>
       </button>
       {isOpen && (
         <div className="pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            {children}
         </div>
       )}
    </div>
  )
}

function PriceInput({ label, value, onChange }: { label: string; value?: number; onChange: (v?: number) => void }) {
  return (
    <div className="relative group flex-1">
       <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] group-focus-within:text-primary transition-colors italic">
          {label}
       </span>
       <input 
         type="number" 
         placeholder="0"
         value={value || ""} 
         onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
         className="w-full h-14 pl-14 pr-4 rounded-2xl bg-secondary/30 border border-border/40 text-sm font-black focus:ring-8 focus:ring-primary/5 transition-all outline-none italic"
       />
    </div>
  )
}

import { Check } from "lucide-react"
