"use client"

import { useRef } from "react"
import { Star, BadgeCheck, TrendingDown } from "lucide-react"

import { type Listing, type ListingFilters, type BrandCatalogItem, type CityOption } from "@/types"
import { ListingCard } from "@/components/shared/listing-card"
import { ListingsGridSkeleton } from "@/components/listings/listings-grid-skeleton"
import { cn } from "@/lib/utils"
import { marketplace } from "@/lib/constants/ui-strings"

// Marketplace Feature Components/Hooks
import { useMarketplaceLogic } from "@/features/marketplace/hooks/use-marketplace-logic"
import { MarketplaceHeader } from "@/features/marketplace/components/marketplace-header"
import { MarketplaceControls } from "@/features/marketplace/components/marketplace-controls"
import { MarketplaceSidebar } from "@/features/marketplace/components/marketplace-sidebar"
import { ActiveFilterTags } from "@/features/marketplace/components/active-filter-tags"
import { useEffect } from "react"

const QUICK_FILTERS = [
  { label: marketplace.quickFilters.all, type: "reset" as const, icon: null },
  { label: marketplace.quickFilters.expert, type: "expert" as const, icon: BadgeCheck },
  { label: marketplace.quickFilters.priceDrop, type: "price_low" as const, icon: TrendingDown },
  { label: marketplace.quickFilters.newest, type: "newest" as const, icon: Star },
]

const PAGE_SIZE_OPTIONS = [12, 24, 48]

interface ListingsPageClientProps {
  initialResult: {
    listings: Listing[]
    total: number
    page: number
    limit: number
    hasMore: boolean
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
  const {
    filters,
    setFilters,
    isPending,
    viewMode,
    setViewMode,
    isSortOpen,
    setIsSortOpen,
    activeFiltersCount,
    allListings,
    total,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    handleFilterChange,
    handleReset,
    applyFilters
  } = useMarketplaceLogic({ initialResult, initialFilters })

  // Intersection Observer for Infinite Scroll
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchNextPage()
      },
      { rootMargin: "200px" }
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])
  const isInitialPage = allListings.length === initialResult.listings.length;

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 lg:px-10 lg:py-12 bg-background min-h-screen">

      {/* Header & Control Center */}
      <div className="mb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <MarketplaceHeader filters={filters} total={total} />

          <MarketplaceControls 
            filters={filters}
            activeFiltersCount={activeFiltersCount}
            brands={brands}
            cities={cities}
            viewMode={viewMode}
            setViewMode={setViewMode}
            isSortOpen={isSortOpen}
            setIsSortOpen={setIsSortOpen}
            handleFilterChange={handleFilterChange}
            handleReset={handleReset}
            applyFilters={applyFilters}
            userId={userId}
            total={total}
          />
        </div>

        {/* Quick Filter Chips */}
        <div className="mt-8 flex flex-wrap gap-3">
          {QUICK_FILTERS.map((qf) => {
            const isActive =
              (qf.type === "expert" && filters.hasExpertReport === true) ||
              (qf.type === "price_low" && filters.sort === "price_asc") ||
              (qf.type === "newest" && (filters.sort === "newest" || !filters.sort))

            return (
              <button
                key={qf.label}
                onClick={() => {
                  if (qf.type === "reset") handleReset()
                  else if (qf.type === "expert") handleFilterChange("hasExpertReport", filters.hasExpertReport ? undefined : true)
                  else if (qf.type === "price_low") handleFilterChange("sort", filters.sort === "price_asc" ? "newest" : "price_asc")
                  else if (qf.type === "newest") handleFilterChange("sort", "newest")
                }}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm active:scale-95",
                  qf.type === "reset"
                    ? "border-border bg-card text-muted-foreground hover:border-foreground hover:text-foreground"
                    : isActive
                    ? "border-foreground bg-foreground text-background shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-foreground hover:text-foreground"
                )}
              >
                {qf.icon && <qf.icon size={12} strokeWidth={3} />}
                {qf.label}
              </button>
            )
          })}
        </div>

        <ActiveFilterTags 
          filters={filters}
          handleFilterChange={handleFilterChange}
          handleReset={handleReset}
          applyFilters={applyFilters}
          setFilters={setFilters}
        />
      </div>

      {/* Main Layout */}
      <div className="flex flex-col gap-10 lg:flex-row">

        <MarketplaceSidebar 
           brands={brands}
           cities={cities}
           filters={filters}
           isPending={isPending}
           activeFiltersCount={activeFiltersCount}
           handleFilterChange={handleFilterChange}
           handleReset={handleReset}
        />

        {/* Results */}
        <div className="flex-1 min-w-0">
          {isPending ? (
            <div className="bg-card rounded-2xl p-10 border border-border shadow-sm min-h-[600px]">
              <ListingsGridSkeleton />
            </div>
          ) : allListings.length > 0 ? (
            <div className="space-y-8">
              <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/30 p-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-bold text-muted-foreground">
                  Toplam <span className="text-foreground font-bold">{total}</span> ilan arasından <span className="text-foreground font-bold">{allListings.length}</span> araç gösteriliyor
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Gösterim:</span>
                  <select
                    value={filters.limit ?? initialResult.limit}
                    onChange={(event) => handleFilterChange("limit", Number(event.target.value))}
                    className="h-8 rounded-lg border border-border bg-card px-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={cn(
                "relative transition-opacity duration-normal",
                isPending ? "opacity-50 pointer-events-none" : "opacity-100",
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
                  : "flex flex-col gap-4"
              )}>
                {isPending && (
                  <div className="absolute inset-0 z-10 bg-background/20 backdrop-blur-[1px] flex items-center justify-center">
                     <div className="w-full h-full animate-in fade-in duration-normal">
                        <ListingsGridSkeleton />
                     </div>
                  </div>
                )}
                {allListings.map((listing, index) => (
                  <ListingCard
                    key={`${listing.id}-${index}`}
                    listing={listing}
                    priority={(viewMode === "grid" ? index < 4 : index < 2) && isInitialPage}
                    variant={viewMode}
                  />
                ))}
              </div>

              {/* Infinite Scroll trigger */}
              <div ref={loadMoreRef} className="py-6 flex justify-center">
                {isFetchingNextPage ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <span className="text-sm font-medium text-muted-foreground">Daha fazla yükleniyor...</span>
                  </div>
                ) : hasNextPage ? (
                  <button 
                    onClick={() => fetchNextPage()} 
                    className="h-10 rounded-lg border border-border bg-card px-6 text-sm font-medium hover:bg-muted"
                  >
                    Daha Fazla Göster
                  </button>
                ) : allListings.length > 0 ? (
                  <p className="text-sm font-medium text-muted-foreground/70">Mevcut tüm ilanları görüntülediniz.</p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-24 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted/40">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground tracking-tight">Sonuç bulunamadı</h3>
              <p className="mb-8 max-w-sm text-sm text-muted-foreground font-medium">
                Aradığınız kriterlere uygun araç bulunamadı. Filtreleri değiştirip tekrar deneyin.
              </p>
              <button
                onClick={handleReset}
                className="h-12 rounded-xl bg-primary px-10 text-xs font-bold text-primary-foreground hover:opacity-90 transition-all shadow-sm uppercase tracking-widest"
              >
                Tüm Filtreleri Temizle
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
