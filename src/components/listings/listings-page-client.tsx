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
    <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-10">
      
      {/* Showroom Results Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 mb-12">
         <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-black tracking-tightest leading-tight text-slate-900 mb-6">
               {pageTitle}
            </h1>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white shadow-xl shadow-slate-900/10">
                  <span className="text-xl font-black italic tracking-tighter leading-none">{initialResult.total}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic leading-none">ARAÇ</span>
               </div>
               <p className="text-sm font-medium text-slate-400 leading-relaxed max-w-sm italic">
                  {filters.brand 
                    ? `${filters.brand} markasının en seçkin ve doğrulanmış dijital ilanlarını burada bulabilirsiniz.` 
                    : "Türkiye genelindeki en prestijli araç parkurunu keşfedin. Tüm ilanlar moderasyon onaylıdır."}
               </p>
            </div>
         </div>

         {/* View Controls & Sort */}
         <div className="flex items-center gap-3 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm border-b-2 border-slate-200/60">
            <button 
              onClick={() => setViewMode("grid")}
              className={cn(
                "h-11 px-6 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                viewMode === "grid" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
              )}
            >
               <LayoutGrid size={16} />
               <span className="hidden sm:inline">KUTUCUK</span>
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={cn(
                "h-11 px-6 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                viewMode === "list" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
              )}
            >
               <List size={16} />
               <span className="hidden sm:inline">LİSTE</span>
            </button>
            <div className="w-px h-8 bg-slate-100 mx-2" />
            
            <div className="relative">
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="h-11 px-6 rounded-xl text-slate-500 hover:text-slate-900 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
              >
                <ArrowDownWideNarrow size={16} />
                <span className="hidden sm:inline">SIRALAMA</span>
                <ChevronDown size={14} className={cn("transition-transform", isSortOpen && "rotate-180")} />
              </button>
              
              {isSortOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 py-3 animate-in fade-in zoom-in-95 duration-200">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        handleFilterChange("sort", option.value as ListingFilters["sort"]);
                        setIsSortOpen(false);
                      }}
                      className={cn(
                        "w-full px-6 py-3 text-left text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors",
                        filters.sort === option.value ? "text-primary bg-primary/5" : "text-slate-400"
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
        <aside className="hidden lg:block w-[320px] shrink-0 sticky top-28 bg-white rounded-[32px] border border-slate-100 shadow-sm p-2">
           <div className="p-6">
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
             className="lg:hidden w-full h-14 rounded-2xl bg-white border border-slate-100 shadow-sm mb-8 flex items-center justify-between px-6 font-black uppercase tracking-widest text-[10px]"
           >
              <div className="flex items-center gap-3">
                 <SlidersHorizontal size={18} className="text-primary" />
                 FİLTRELERİ GÖSTER
              </div>
              {activeFiltersCount > 0 && (
                 <span className="h-6 px-3 rounded-full bg-primary text-white text-[9px] flex items-center font-black">
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
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8" 
                  : "flex flex-col gap-6"
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
              <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
                 <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6 font-black text-2xl">
                    ?
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-2">SONUÇ BULUNAMADI</h3>
                 <p className="text-slate-400 font-medium text-sm max-w-sm mb-10 leading-relaxed italic">
                    Aradığınız kriterlere uygun bir araç şu an dijital showroomumuzda bulunmuyor. Lütfen filtrelerinizi güncelleyin.
                 </p>
                 <button 
                   onClick={handleReset}
                   className="h-12 px-8 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all"
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