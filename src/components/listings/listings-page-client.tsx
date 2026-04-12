"use client"

import { useTransition, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LayoutGrid, List, SlidersHorizontal, ArrowDownWideNarrow } from "lucide-react"

import { type Listing, type ListingFilters, type BrandCatalogItem, type CityOption } from "@/types"
import { CarCard } from "@/components/modules/listings/car-card"
import { SmartFilters } from "@/components/modules/listings/smart-filters"
import { ListingsGridSkeleton } from "@/components/listings/listings-grid-skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Compute active filters count
  const activeFiltersCount = Object.entries(filters).filter(([key, val]) => {
     if (key === "limit" || key === "offset") return false
     return val !== undefined && val !== ""
  }).length

  const filteredModels = (brands.find(b => b.brand === filters.brand)?.models || []);
  const filteredDistricts = (cities.find(c => c.city === filters.city)?.districts || []);

  const handleFilterChange = <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    applyFilters(newFilters)
  }

  const handleReset = () => {
    setFilters({})
    applyFilters({})
  }

  const applyFilters = (newFilters: ListingFilters) => {
    startTransition(() => {
      const params = new URLSearchParams()
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.set(key, String(value))
        }
      })
      router.push(`/listings?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Page Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
         <div>
            <div className="flex items-center gap-3 mb-2">
               <h1 className="text-3xl font-black tracking-tight italic">
                  Tüm <span className="text-primary">İlanlar</span>
               </h1>
               <Badge className="bg-primary/10 text-primary border-none font-black px-2 py-0.5 mt-1">
                  {initialResult.total} Araç
               </Badge>
            </div>
            <p className="text-sm font-medium text-muted-foreground italic">
               Türkiye genelindeki en güncel car market ilanlarını keşfedin.
            </p>
         </div>

         {/* View Controls & Sort */}
         <div className="flex items-center gap-3 p-1 bg-secondary/50 rounded-2xl border border-border">
            <button 
              onClick={() => setViewMode("grid")}
              className={cn("p-2 px-3 rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase italic", viewMode === "grid" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}
            >
               <LayoutGrid size={16} />
               <span className="hidden sm:inline">Kutucuk</span>
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={cn("p-2 px-3 rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase italic", viewMode === "list" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}
            >
               <List size={16} />
               <span className="hidden sm:inline">Liste</span>
            </button>
            <div className="w-px h-6 bg-border mx-1" />
            <button className="p-2 px-3 rounded-xl text-muted-foreground hover:text-foreground transition-all flex items-center gap-2 text-xs font-black uppercase italic">
               <ArrowDownWideNarrow size={16} />
               <span className="hidden sm:inline">Sıralama</span>
            </button>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        
        {/* Modern Sidebar Filters */}
        <aside className="hidden lg:block w-[280px] shrink-0 sticky top-24">
           <div className="p-6 rounded-[32px] bg-white border border-border card-shadow">
              <SmartFilters 
                brands={brands}
                cities={cities}
                filters={filters}
                models={filteredModels}
                districts={filteredDistricts}
                onFilterChange={handleFilterChange}
                onReset={handleReset}
                activeCount={activeFiltersCount}
              />
           </div>
        </aside>

        {/* Results Grid */}
        <div className="flex-1 min-w-0 w-full">
           
           {/* Mobile Filter Trigger */}
           <button 
             onClick={() => setIsFilterOpen(true)}
             className="lg:hidden w-full h-14 rounded-2xl bg-white border border-border card-shadow mb-6 flex items-center justify-between px-6 font-black italic uppercase tracking-tighter"
           >
              <div className="flex items-center gap-2">
                 <SlidersHorizontal size={18} className="text-primary" />
                 Filtreler
              </div>
              {activeFiltersCount > 0 && (
                 <span className="h-6 px-2 rounded-lg bg-primary text-white text-[10px] flex items-center font-black">
                    {activeFiltersCount} AKTİF
                 </span>
              )}
           </button>

           {isPending ? (
              <ListingsGridSkeleton />
           ) : initialResult.listings.length > 0 ? (
              <div className={cn(
                "animate-in fade-in duration-500",
                viewMode === "grid" 
                  ? "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6" 
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
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                 <div className="size-20 bg-secondary rounded-full flex items-center justify-center text-muted-foreground">
                    <SlidersHorizontal size={32} />
                 </div>
                 <h3 className="text-2xl font-black italic uppercase tracking-tighter">İlan Bulunamadı</h3>
                 <p className="text-muted-foreground font-medium max-w-sm">
                    Kriterlerinize uygun araç bulamadık. Daha geniş filtreler denemeye ne dersiniz?
                 </p>
                 <button 
                   onClick={handleReset}
                   className="h-12 px-8 rounded-xl bg-primary text-white font-black uppercase text-sm italic shadow-lg shadow-primary/20"
                 >
                    Aramayı Sıfırla
                 </button>
              </div>
           )}
        </div>
      </div>
    </div>
  )
}