"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LayoutGrid, List, SlidersHorizontal, ArrowDownWideNarrow, ChevronDown } from "lucide-react"

import { type Listing, type ListingFilters, type BrandCatalogItem, type CityOption } from "@/types"
import { CarCard } from "@/components/modules/listings/car-card"
import { SmartFilters } from "@/components/modules/listings/smart-filters"
import { ListingsGridSkeleton } from "@/components/listings/listings-grid-skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const SORT_OPTIONS = [
  { value: "newest", label: "En Yeni" },
  { value: "oldest", label: "En Eski" },
  { value: "price_asc", label: "Fiyat (Düşük)" },
  { value: "price_desc", label: "Fiyat (Yüksek)" },
  { value: "mileage_asc", label: "Kilometre (Düşük)" },
  { value: "mileage_desc", label: "Kilometre (Yüksek)" },
  { value: "year_desc", label: "Yıl (Yeni)" },
  { value: "year_asc", label: "Yıl (Eski)" },
]

interface ListingsPageClientProps {
  initialResult: {
    listings: Listing[]
    total: number
  }
  brands: BrandCatalogItem[]
  cities: CityOption[]
  initialFilters: ListingFilters
  userId?: string
}

export function ListingsPageClient({
  initialResult,
  brands,
  cities,
  initialFilters,
  userId
}: ListingsPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [filters, setFilters] = useState<ListingFilters>(initialFilters)

  // Sync internal state when props change (from URL navigation)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters(initialFilters)
  }, [JSON.stringify(initialFilters)])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)

  // Compute active filters count
  const activeFiltersCount = Object.entries(filters).filter(([key, val]) => {
     if (key === "limit" || key === "offset") return false
     return val !== undefined && val !== ""
  }).length

  const filteredModels = (brands.find(b => b.brand === filters.brand)?.models || []).map(m => m.name);
  const filteredTrims = (brands.find(b => b.brand === filters.brand)?.models?.find(m => m.name === filters.model)?.trims || []);
  const filteredDistricts = (cities.find(c => c.city === filters.city)?.districts || []);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const handleFilterChange = <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Sort changes should be immediate for snappy feel
    if (key === "sort") {
      applyFilters(newFilters, true)
      return
    }

    // Debounce other filters (price, mileage, search etc)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      applyFilters(newFilters)
    }, 500)
  }

  const handleReset = () => {
    setFilters({})
    applyFilters({}, true)
  }

  const applyFilters = (newFilters: ListingFilters, immediate = false) => {
    const fn = () => {
      const params = new URLSearchParams()
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.set(key, String(value))
        }
      })
      router.push(`/listings?${params.toString()}`, { scroll: false })
    }

    if (immediate) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      fn()
    } else {
      startTransition(fn)
    }
  }

  const pageTitle = filters.brand 
    ? `Satılık ${filters.brand} ${filters.model || ""} İlanları`
    : "Tüm Satılık İlanlar"

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-24">
      
      {/* Showroom Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
         <div className="max-w-2xl">
            <div className="flex items-center gap-4 mb-4">
               <div className="h-px w-12 bg-primary" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">Dijital Showroom</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tightest leading-[0.9] uppercase italic mb-6">
               {pageTitle.split(" ").map((word, i, arr) => (
                 <span key={i} className={cn(i === arr.length - 1 && "text-primary block md:inline")}>
                   {word}{" "}
                 </span>
               ))}
            </h1>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary/50 border border-border/40">
                  <span className="text-2xl font-black italic tracking-tighter leading-none">{initialResult.total}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic leading-none">ARAÇ</span>
               </div>
               <p className="text-sm font-bold text-muted-foreground/40 italic leading-relaxed max-w-sm uppercase tracking-tighter">
                  {filters.brand 
                    ? `${filters.brand} markasının seçkin ve doğrulanmış ilanlarını keşfedin.` 
                    : "Türkiye genelindeki en premium araç parkurunu keşfedin."}
               </p>
            </div>
         </div>

         {/* View Controls & Sort */}
         <div className="flex items-center gap-3 p-1.5 bg-secondary/30 rounded-3xl border border-border/40 backdrop-blur-md">
            <button 
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-3 px-5 rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase italic tracking-widest",
                viewMode === "grid" ? "bg-white text-primary shadow-xl shadow-primary/10" : "text-muted-foreground hover:text-foreground"
              )}
            >
               <LayoutGrid size={16} />
               <span className="hidden sm:inline">KUTUCUK</span>
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={cn(
                "p-3 px-5 rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase italic tracking-widest",
                viewMode === "list" ? "bg-white text-primary shadow-xl shadow-primary/10" : "text-muted-foreground hover:text-foreground"
              )}
            >
               <List size={16} />
               <span className="hidden sm:inline">LİSTE</span>
            </button>
            <div className="w-px h-8 bg-border/40 mx-2" />
            
            <div className="relative">
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="p-3 px-5 rounded-2xl text-muted-foreground hover:text-foreground transition-all flex items-center gap-2 text-[10px] font-black uppercase italic tracking-widest"
              >
                <ArrowDownWideNarrow size={16} />
                <span className="hidden sm:inline">SIRALAMA</span>
                <ChevronDown size={14} className={cn("transition-transform", isSortOpen && "rotate-180")} />
              </button>
              
              {isSortOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 bg-white/80 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-3xl z-50 py-3 animate-in fade-in zoom-in-95 duration-200">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        handleFilterChange("sort", option.value as ListingFilters["sort"]);
                        setIsSortOpen(false);
                      }}
                      className={cn(
                        "w-full px-6 py-3 text-left text-[11px] font-black uppercase italic tracking-widest hover:bg-primary/5 transition-colors",
                        filters.sort === option.value ? "text-primary bg-primary/5" : "text-muted-foreground/60"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        
        {/* Elite Sidebar Filters */}
        <aside className="hidden lg:block w-[320px] shrink-0 sticky top-24">
           <div className="p-8 rounded-[40px] bg-card border border-border/40 showroom-card">
              <SmartFilters 
                brands={brands}
                cities={cities}
                filters={filters}
                models={filteredModels}
                trims={filteredTrims}
                districts={filteredDistricts}
                onFilterChange={handleFilterChange}
                onReset={handleReset}
                activeCount={activeFiltersCount}
              />
           </div>
        </aside>

        {/* Results Stream */}
        <div className="flex-1 min-w-0 w-full">
           
           {/* Mobile Filter Trigger */}
           <button 
             onClick={() => setIsFilterOpen(true)}
             className="lg:hidden w-full h-16 rounded-[32px] bg-card border border-border/40 showroom-card mb-8 flex items-center justify-between px-8 font-black italic uppercase tracking-[0.2em] text-[11px]"
           >
              <div className="flex items-center gap-3">
                 <SlidersHorizontal size={18} className="text-primary" />
                 FİLTRE SİSTEMİ
              </div>
              {activeFiltersCount > 0 && (
                 <span className="h-7 px-3 rounded-full bg-primary text-white text-[9px] flex items-center font-black tracking-widest">
                    {activeFiltersCount} AKTİF
                 </span>
              )}
           </button>

           {isPending ? (
              <ListingsGridSkeleton />
           ) : initialResult.listings.length > 0 ? (
              <div className={cn(
                "animate-in fade-in duration-700",
                viewMode === "grid" 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8" 
                  : "flex flex-col gap-8"
              )}>
                 {initialResult.listings.map((listing) => (
                    <CarCard 
                      key={listing.id} 
                      listing={listing} 
                      variant={viewMode}
                    />
                 ))}
              </div>
           ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                 <div className="size-24 bg-secondary/30 rounded-full flex items-center justify-center text-muted-foreground/20 mb-8 border border-border/40">
                    <SlidersHorizontal size={40} />
                 </div>
                 <h3 className="text-3xl font-black italic uppercase tracking-tightest mb-4">SONUÇ BULUNAMADI</h3>
                 <p className="text-muted-foreground/40 font-bold uppercase tracking-widest text-[11px] max-w-sm mb-10 leading-relaxed">
                    Aradığınız kriterlere uygun bir araç şu an dijital showroomumuzda bulunmuyor.
                 </p>
                 <button 
                   onClick={handleReset}
                   className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase text-[11px] italic tracking-[0.2em] shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all"
                 >
                    KRİTERLERİ SIFIRLA
                 </button>
              </div>
           )}
        </div>
      </div>
    </div>
  )
}