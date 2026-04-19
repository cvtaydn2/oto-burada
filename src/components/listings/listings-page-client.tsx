"use client"

import dynamic from "next/dynamic"
import { useState, useTransition, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LayoutGrid, List, ArrowDownUp, Star, BadgeCheck, TrendingDown, SlidersHorizontal } from "lucide-react"

import Link from "next/link"
import { type Listing, type ListingFilters, type BrandCatalogItem, type CityOption } from "@/types"
import { CarCard } from "@/components/modules/listings/car-card"
import { ListingsGridSkeleton } from "@/components/listings/listings-grid-skeleton"
import { cn, formatTL } from "@/lib/utils"
import { createSearchParamsFromListingFilters } from "@/services/listings/listing-filters"
import { useInfiniteQuery } from "@tanstack/react-query"
import { marketplace } from "@/lib/constants/ui-strings"
import { useKeyboard } from "@/hooks/use-keyboard"

const DEBOUNCE_DELAY_MS = 400

function useIntersectionObserver({
  onIntersect,
  enabled = true,
}: {
  onIntersect: () => void
  enabled?: boolean
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!enabled || !ref.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onIntersect()
          }
        })
      },
      { rootMargin: "200px" } // trigger earlier
    )

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [onIntersect, enabled])

  return ref
}

const SmartFilters = dynamic(
  () => import("@/components/modules/listings/smart-filters").then((mod) => mod.SmartFilters),
  {
    loading: () => <div className="min-h-[320px] rounded-xl border border-border bg-card shadow-sm" />,
  },
)

const MobileFilterDrawer = dynamic(
  () => import("@/components/ui/mobile-filter-drawer").then((mod) => mod.MobileFilterDrawer),
)

const SORT_OPTIONS = [
  { value: "newest", label: marketplace.sortOptions.newest },
  { value: "oldest", label: marketplace.sortOptions.oldest },
  { value: "price_asc", label: marketplace.sortOptions.priceAsc },
  { value: "price_desc", label: marketplace.sortOptions.priceDesc },
  { value: "mileage_asc", label: marketplace.sortOptions.mileageAsc },
  { value: "mileage_desc", label: marketplace.sortOptions.mileageDesc },
  { value: "year_desc", label: marketplace.sortOptions.yearDesc },
  { value: "year_asc", label: marketplace.sortOptions.yearAsc },
]

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
}

export function ListingsPageClient({
  initialResult,
  brands,
  cities,
  initialFilters,
}: ListingsPageClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // FIX: Sync filters state with initialFilters when URL changes (navigation)
  const [filters, setFilters] = useState<ListingFilters>(initialFilters)
  useEffect(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  // INFINITE RUNTIME
  const queryKey = ["listings", initialFilters]

  const fetchListings = async ({ pageParam }: { pageParam: number }) => {
    const params = createSearchParamsFromListingFilters({ ...initialFilters, page: pageParam })
    const res = await fetch(`/api/listings?${params.toString()}`)
    if (!res.ok) throw new Error("İlanlar yüklenirken hata oluştu.")
    const json = await res.json()
    return json.data as typeof initialResult
  }

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: fetchListings,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialData: {
      pages: [initialResult],
      pageParams: [1]
    }
  })

  // Set up the intersection observer to fetch the next page
  const loadMoreRef = useIntersectionObserver({
    onIntersect: fetchNextPage,
    enabled: hasNextPage && !isFetchingNextPage,
  })

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isSortOpen, setIsSortOpen] = useState(false)

  useKeyboard({
    onEscape: useCallback(() => setIsSortOpen(false), []),
    enabled: isSortOpen,
  })

  const activeFiltersCount = Object.entries(filters).filter(([key, val]) => {
    if (key === "limit" || key === "sort" || key === "page") return false
    return val !== undefined && val !== ""
  }).length

  const filteredModels = (brands.find(b => b.brand === filters.brand)?.models || []).map(m => m.name)
  const filteredTrims = (brands.find(b => b.brand === filters.brand)?.models?.find(m => m.name === filters.model)?.trims || [])
  const filteredDistricts = (cities.find(c => c.city === filters.city)?.districts || [])

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const applyFilters = useCallback((newFilters: ListingFilters, immediate = false) => {
    const fn = () => {
      const params = createSearchParamsFromListingFilters(newFilters)
      startTransition(() => {
        router.push(`/listings?${params.toString()}`, { scroll: true })
      })
    }

    if (immediate) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      fn()
    } else {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(fn, DEBOUNCE_DELAY_MS)
    }
  }, [router, startTransition])

  const handleFilterChange = useCallback(<K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => {
    const newFilters: ListingFilters = { ...filters, [key]: value, page: 1 }

    if (key === "brand") {
      newFilters.model = undefined
      newFilters.carTrim = undefined
    }

    if (key === "model") {
      newFilters.carTrim = undefined
    }

    if (key === "city") {
      newFilters.district = undefined
    }

    setFilters(newFilters)

    // Immediate navigation for sort, limit, select-type filters
    const immediateKeys: (keyof ListingFilters)[] = ["sort", "limit", "brand", "model", "carTrim", "city", "district", "fuelType", "transmission", "hasExpertReport"]
    if (immediateKeys.includes(key)) {
      applyFilters(newFilters, true)
      return
    }

    // Debounced for text/number inputs (price, year, mileage, query, maxTramer)
    applyFilters(newFilters, false)
  }, [filters, applyFilters])

  const handleReset = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    const resetFilters: ListingFilters = { limit: filters.limit ?? initialResult.limit, page: 1, sort: "newest" }
    setFilters(resetFilters)
    const params = createSearchParamsFromListingFilters(resetFilters)
    startTransition(() => {
      router.push(`/listings?${params.toString()}`, { scroll: false })
    })
  }, [filters.limit, initialResult.limit, router, startTransition])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === (filters.sort ?? "newest"))?.label || "En Yeni"
  const allListings = data?.pages.flatMap(p => p.listings) ?? initialResult.listings

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 lg:px-10 lg:py-12 bg-slate-50/30 min-h-screen">

      {/* Header & Control Center */}
      <div className="mb-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-none">
              {filters.brand
                ? `${filters.brand}${filters.model ? ` ${filters.model}` : ""} İlanları`
                : "Tüm Satılık Araçlar"}
            </h1>
            <p className="text-base font-bold text-slate-400 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
              Şu an {initialResult.total} aktif ilan listeleniyor
            </p>
          </div>

          {/* Controls - Glassmorphism Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-white/70 backdrop-blur-xl border border-white p-2 rounded-[2rem] shadow-xl shadow-slate-200/50">
            <MobileFilterDrawer
              brands={brands}
              cities={cities}
              filters={filters}
              activeCount={activeFiltersCount}
            />

            <Link
              href={`/listings/filter?${createSearchParamsFromListingFilters(filters).toString()}`}
              className="flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-5 text-xs font-black text-white hover:bg-black transition-all hover:scale-105 active:scale-95 uppercase tracking-widest shadow-lg shadow-slate-900/20"
            >
              <SlidersHorizontal size={14} strokeWidth={3} />
              Gelişmiş Filtrele
            </Link>

            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/50">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex h-9 w-10 items-center justify-center rounded-lg transition-all",
                  viewMode === "grid"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex h-9 w-10 items-center justify-center rounded-lg transition-all",
                  viewMode === "list"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <List size={18} />
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 text-xs font-black text-slate-600 hover:border-slate-300 transition-all uppercase tracking-widest"
              >
                <ArrowDownUp size={14} strokeWidth={3} />
                <span className="hidden sm:inline">{currentSortLabel}</span>
                <ChevronIcon className={cn("transition-transform size-4 ml-1", isSortOpen && "rotate-180")} />
              </button>

              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                  <ul className="absolute right-0 top-full z-50 mt-3 w-64 rounded-3xl border border-slate-100 bg-white/95 backdrop-blur-2xl p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    {SORT_OPTIONS.map((option) => (
                      <li key={option.value}>
                        <button
                          onClick={() => {
                            handleFilterChange("sort", option.value as ListingFilters["sort"])
                            setIsSortOpen(false)
                          }}
                          className={cn(
                            "w-full px-4 py-3 text-left text-xs font-black rounded-2xl transition-all uppercase tracking-widest",
                            (filters.sort ?? "newest") === option.value
                              ? "bg-slate-900 text-white"
                              : "text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          {option.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
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
                  "flex items-center gap-2 rounded-full border px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95",
                  qf.type === "reset"
                    ? "border-slate-200 bg-white text-slate-500 hover:border-slate-900 hover:text-slate-900"
                    : isActive
                    ? "border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-900/10"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-900 hover:text-slate-900"
                )}
              >
                {qf.icon && <qf.icon size={12} strokeWidth={3} />}
                {qf.label}
              </button>
            )
          })}
        </div>

        {/* Active Filter Tags */}
        {activeFiltersCount > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">Aktif Süzgeçler:</span>
            {filters.brand && (
              <FilterTag
                label={filters.brand}
                onRemove={() => {
                  const nextFilters = { ...filters, brand: undefined, carTrim: undefined, model: undefined, page: 1 };
                  setFilters(nextFilters);
                  applyFilters(nextFilters, true);
                }}
              />
            )}
            {filters.model && (
              <FilterTag label={filters.model} onRemove={() => handleFilterChange("model", undefined)} />
            )}
            {filters.carTrim && (
              <FilterTag label={filters.carTrim} onRemove={() => handleFilterChange("carTrim", undefined)} />
            )}
            {filters.city && (
              <FilterTag
                label={filters.city}
                onRemove={() => {
                  const nextFilters = { ...filters, city: undefined, district: undefined, page: 1 };
                  setFilters(nextFilters);
                  applyFilters(nextFilters, true);
                }}
              />
            )}
            {filters.district && (
              <FilterTag label={filters.district} onRemove={() => handleFilterChange("district", undefined)} />
            )}
            {filters.fuelType && (
              <FilterTag label={filters.fuelType === "benzin" ? "Benzin" : filters.fuelType === "dizel" ? "Dizel" : filters.fuelType} onRemove={() => handleFilterChange("fuelType", undefined)} />
            )}
            {filters.transmission && (
              <FilterTag label={filters.transmission === "otomatik" ? "Otomatik" : filters.transmission === "manuel" ? "Manuel" : "Yarı Otomatik"} onRemove={() => handleFilterChange("transmission", undefined)} />
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <FilterTag
                label={`${filters.minPrice ? formatTL(filters.minPrice) : "0"} — ${filters.maxPrice ? formatTL(filters.maxPrice) : "∞"}`}
                onRemove={() => {
                  const f = { ...filters, minPrice: undefined, maxPrice: undefined, page: 1 }
                  setFilters(f)
                  applyFilters(f, true)
                }}
              />
            )}
            {(filters.minYear || filters.maxYear) && (
              <FilterTag
                label={`Model ${filters.minYear ?? "eski"}-${filters.maxYear ?? "güncel"}`}
                onRemove={() => {
                  const nextFilters = { ...filters, minYear: undefined, maxYear: undefined, page: 1 }
                  setFilters(nextFilters)
                  applyFilters(nextFilters, true)
                }}
              />
            )}
            {filters.maxMileage !== undefined && (
              <FilterTag
                label={`Max ${filters.maxMileage.toLocaleString("tr-TR")} km`}
                onRemove={() => handleFilterChange("maxMileage", undefined)}
              />
            )}
            {filters.maxTramer !== undefined && (
              <FilterTag
                label={`Max ${filters.maxTramer.toLocaleString("tr-TR")} TL tramer`}
                onRemove={() => handleFilterChange("maxTramer", undefined)}
              />
            )}
            {filters.query && (
              <FilterTag label={`"${filters.query}"`} onRemove={() => handleFilterChange("query", undefined)} />
            )}
            {filters.hasExpertReport && (
              <FilterTag label="Ekspertizli" onRemove={() => handleFilterChange("hasExpertReport", undefined)} />
            )}
            <button
              onClick={handleReset}
              className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest pl-2"
            >
              Temizle
            </button>
          </div>
        )}
      </div>

      {/* Main Layout */}
      <div className="flex flex-col gap-10 lg:flex-row">

        {/* Desktop Sidebar - Premium Shell */}
        <aside className="hidden lg:block w-[320px] shrink-0">
          <div className={cn(
            "sticky top-28 rounded-[2.5rem] border border-slate-200 bg-white overflow-hidden shadow-2xl shadow-slate-200/50 transition-all",
            isPending && "opacity-50 pointer-events-none grayscale"
          )}>
            <div className="bg-slate-900 p-6">
               <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <SlidersHorizontal size={14} />
                  Filtreleme
               </h3>
            </div>
            <div className="p-2">
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
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {isPending ? (
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm min-h-[600px]">
              <ListingsGridSkeleton />
            </div>
          ) : initialResult.listings.length > 0 ? (
            <div className="space-y-8">
              <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white/50 p-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-bold text-slate-500">
                  Toplam <span className="text-slate-900 font-black">{initialResult.total}</span> ilan arasından <span className="text-slate-900 font-black">{allListings.length}</span> araç gösteriliyor
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gösterim:</span>
                  <select
                    value={filters.limit ?? initialResult.limit}
                    onChange={(event) => handleFilterChange("limit", Number(event.target.value))}
                    className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={cn(
                "animate-in fade-in duration-700",
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
                  : "flex flex-col gap-4"
              )}>
                {allListings.map((listing, index) => (
                  <CarCard
                    key={`${listing.id}-${index}`} /* In case of duplicates during optimistic updates */
                    listing={listing}
                    priority={viewMode === "grid" ? index < 4 : index < 2}
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
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-24 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted/30">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">Sonuç bulunamadı</h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                Aradığınız kriterlere uygun araç bulunamadı. Filtreleri değiştirip tekrar deneyin.
              </p>
              <button
                onClick={handleReset}
                className="h-10 rounded-lg bg-blue-500 px-8 text-sm font-bold text-white hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
              >
                Filtreleri Temizle
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="group flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-4 pr-2 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest shadow-sm hover:border-slate-900 transition-all">
      <span>{label}</span>
      <button 
        onClick={onRemove} 
        className="size-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-90"
      >
        <svg className="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

