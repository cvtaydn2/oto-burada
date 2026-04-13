"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { LayoutGrid, List, SlidersHorizontal, ArrowDownWideNarrow, ChevronDown } from "lucide-react"

import { type Listing, type ListingFilters, type BrandCatalogItem, type CityOption } from "@/types"
import { CarCard } from "@/components/modules/listings/car-card"
import { SmartFilters } from "@/components/modules/listings/smart-filters"
import { ListingsGridSkeleton } from "@/components/listings/listings-grid-skeleton"
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
    <div className="mx-auto max-w-[1280px] px-4 py-6 lg:px-6 lg:py-8">
      
      {/* Showroom Results Header */}
      <div className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
         <div className="max-w-2xl">
            <h1 className="mb-2 text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
               {pageTitle}
            </h1>
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-1 rounded-md bg-slate-100 px-3 py-1.5">
                  <span className="text-base font-semibold text-slate-900">{initialResult.total}</span>
                  <span className="text-xs font-medium text-slate-500">ilan</span>
               </div>
               <p className="max-w-md text-sm text-slate-500">
                  {filters.brand 
                    ? `${filters.brand} için güncel ilanlar listeleniyor.`
                    : "Aradığınız aracı filtreleyerek hızlıca bulun."}
               </p>
            </div>
         </div>

         <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1.5">
            <button 
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex h-9 items-center gap-2 rounded-md px-3 text-xs font-medium transition-all",
                viewMode === "grid" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"
              )}
            >
               <LayoutGrid size={16} />
               <span className="hidden sm:inline">Grid</span>
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={cn(
                "flex h-9 items-center gap-2 rounded-md px-3 text-xs font-medium transition-all",
                viewMode === "list" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"
              )}
            >
               <List size={16} />
               <span className="hidden sm:inline">Liste</span>
            </button>
            <div className="mx-1 h-6 w-px bg-slate-200" />
            
            <div className="relative">
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex h-9 items-center gap-2 rounded-md px-3 text-xs font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
              >
                <ArrowDownWideNarrow size={16} />
                <span className="hidden sm:inline">Sıralama</span>
                <ChevronDown size={14} className={cn("transition-transform", isSortOpen && "rotate-180")} />
              </button>
              
              {isSortOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-slate-200 bg-white py-2 shadow-xl">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        handleFilterChange("sort", option.value as ListingFilters["sort"]);
                        setIsSortOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors",
                        filters.sort === option.value ? "bg-primary/5 font-medium text-primary" : "text-slate-600"
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

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        
        {/* Elite Sidebar Filters */}
        <aside className="sticky top-20 hidden w-[300px] shrink-0 rounded-xl border border-slate-200 bg-white p-2 lg:block">
           <div className="p-4">
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
             className="mb-5 flex h-12 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold lg:hidden"
           >
              <div className="flex items-center gap-3">
                 <SlidersHorizontal size={18} className="text-primary" />
                 Filtreleri Göster
              </div>
              {activeFiltersCount > 0 && (
                 <span className="flex h-6 items-center rounded-full bg-primary px-2.5 text-[10px] font-medium text-white">
                    {activeFiltersCount} aktif
                 </span>
              )}
           </button>

           {isPending ? (
              <ListingsGridSkeleton />
           ) : initialResult.listings.length > 0 ? (
              <div className={cn(
                "animate-in fade-in duration-700",
                viewMode === "grid" 
                  ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" 
                  : "flex flex-col gap-4"
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
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-24 text-center">
                 <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-slate-50 text-2xl font-bold text-slate-300">
                    ?
                 </div>
                 <h3 className="mb-2 text-xl font-semibold text-slate-900">Sonuç bulunamadı</h3>
                 <p className="mb-6 max-w-sm text-sm text-slate-500">
                    Aradığınız kriterlere uygun araç bulunamadı. Filtreleri değiştirip tekrar deneyebilirsiniz.
                 </p>
                 <button 
                   onClick={handleReset}
                   className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800"
                 >
                    Kriterleri sıfırla
                 </button>
              </div>
           )}
        </div>
      </div>
    </div>
  )
}