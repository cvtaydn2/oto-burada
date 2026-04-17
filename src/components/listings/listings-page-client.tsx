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

const SmartFilters = dynamic(
  () => import("@/components/modules/listings/smart-filters").then((mod) => mod.SmartFilters),
  {
    loading: () => <div className="min-h-[320px] rounded-xl border border-slate-200 bg-white shadow-sm" />,
  },
)

const MobileFilterDrawer = dynamic(
  () => import("@/components/ui/mobile-filter-drawer").then((mod) => mod.MobileFilterDrawer),
)

const SORT_OPTIONS = [
  { value: "newest", label: "En Yeni" },
  { value: "oldest", label: "En Eski" },
  { value: "price_asc", label: "Fiyat (Düşükten Yükseğe)" },
  { value: "price_desc", label: "Fiyat (Yüksekten Düşüğe)" },
  { value: "mileage_asc", label: "Kilometre (Düşükten Yükseğe)" },
  { value: "mileage_desc", label: "Kilometre (Yüksekten Düşüğe)" },
  { value: "year_desc", label: "Yıl (Yeniden Eskiye)" },
  { value: "year_asc", label: "Yıl (Eskiden Yeniye)" },
]

const QUICK_FILTERS = [
  { label: "Tüm İlanlar", type: "reset" as const, icon: null },
  { label: "Ekspertizli", type: "expert" as const, icon: BadgeCheck },
  { label: "Fiyatı Düşen", type: "price_low" as const, icon: TrendingDown },
  { label: "Yeni Eklenen", type: "newest" as const, icon: Star },
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

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isSortOpen, setIsSortOpen] = useState(false)

  // Close sort dropdown on Escape key
  useEffect(() => {
    if (!isSortOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSortOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isSortOpen])

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
      debounceTimerRef.current = setTimeout(fn, 400)
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

  const handlePageChange = useCallback((page: number) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    const nextFilters = { ...filters, page }
    setFilters(nextFilters)
    const params = createSearchParamsFromListingFilters(nextFilters)
    startTransition(() => {
      router.push(`/listings?${params.toString()}`, { scroll: false })
    })
  }, [filters, router, startTransition])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === (filters.sort ?? "newest"))?.label || "En Yeni"
  const currentPage = initialResult.page
  const totalPages = Math.max(1, Math.ceil(initialResult.total / initialResult.limit))
  const canGoPrev = currentPage > 1
  const canGoNext = currentPage < totalPages
  const startIndex = initialResult.total === 0 ? 0 : (currentPage - 1) * initialResult.limit + 1
  const endIndex = Math.min(currentPage * initialResult.limit, initialResult.total)

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-6 lg:py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {filters.brand
                ? `${filters.brand}${filters.model ? ` ${filters.model}` : ""} İlanları`
                : "Tüm Satılık Araçlar"}
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {initialResult.total} ilan bulundu
            </p>
          </div>

          {/* Controls Row */}
          <div className="flex items-center gap-2.5">
            <MobileFilterDrawer
              brands={brands}
              cities={cities}
              filters={filters}
              activeCount={activeFiltersCount}
            />

            <Link
              href={`/listings/filter?${createSearchParamsFromListingFilters(filters).toString()}`}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <SlidersHorizontal size={15} />
              <span className="hidden sm:inline">Gelişmiş</span>
            </Link>

            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
              <button
                onClick={() => setViewMode("grid")}
                aria-label="Izgara görünümü"
                aria-pressed={viewMode === "grid"}
                className={cn(
                  "flex h-8 items-center justify-center rounded-md px-2.5 transition-colors",
                  viewMode === "grid"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <LayoutGrid size={16} aria-hidden="true" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                aria-label="Liste görünümü"
                aria-pressed={viewMode === "list"}
                className={cn(
                  "flex h-8 items-center justify-center rounded-md px-2.5 transition-colors",
                  viewMode === "list"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <List size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                aria-haspopup="listbox"
                aria-expanded={isSortOpen}
                aria-label={`Sıralama: ${currentSortLabel}`}
                className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ArrowDownUp size={16} aria-hidden="true" />
                <span className="hidden sm:inline">{currentSortLabel}</span>
                <ChevronIcon className={cn("transition-transform size-4", isSortOpen && "rotate-180")} />
              </button>

              {isSortOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} aria-hidden="true" />
                  <ul
                    role="listbox"
                    aria-label="Sıralama seçenekleri"
                    className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <li key={option.value} role="option" aria-selected={(filters.sort ?? "newest") === option.value}>
                        <button
                          onClick={() => {
                            handleFilterChange("sort", option.value as ListingFilters["sort"])
                            setIsSortOpen(false)
                          }}
                          className={cn(
                            "w-full px-4 py-2 text-left text-sm transition-colors",
                            (filters.sort ?? "newest") === option.value
                              ? "bg-blue-50 font-bold text-blue-600"
                              : "text-gray-600 hover:bg-gray-50"
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

            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 h-9">
              <label htmlFor="page-size-select" className="text-xs font-semibold text-slate-500">Göster</label>
              <select
                id="page-size-select"
                value={filters.limit ?? initialResult.limit}
                onChange={(event) => handleFilterChange("limit", Number(event.target.value))}
                className="bg-transparent text-sm font-medium text-slate-700 outline-none"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="mt-5 flex flex-wrap gap-2.5">
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
                  "flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-all",
                  qf.type === "reset"
                    ? "border-gray-200 bg-white text-gray-500 hover:border-blue-300 hover:text-blue-500"
                    : isActive
                    ? "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-500/10"
                    : "border-gray-200 bg-white text-gray-500 hover:border-blue-300 hover:text-blue-500"
                )}
              >
                {qf.icon && <qf.icon size={13} />}
                {qf.label}
              </button>
            )
          })}
        </div>

        {/* Active Filter Tags */}
        {activeFiltersCount > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-medium text-slate-400">Aktif filtreler:</span>
            {filters.brand && (
              <FilterTag
                label={filters.brand}
                onRemove={() => {
                  const nextFilters = {
                    ...filters,
                    brand: undefined,
                    carTrim: undefined,
                    model: undefined,
                    page: 1,
                  };
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
                  const nextFilters = {
                    ...filters,
                    city: undefined,
                    district: undefined,
                    page: 1,
                  };
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
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 hover:underline"
            >
              Tümünü temizle
            </button>
          </div>
        )}
      </div>

      {/* Main Layout */}
      <div className="flex flex-col gap-6 lg:flex-row">

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-[300px] shrink-0">
          <div className="sticky top-24 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
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

        {/* Results */}
        <div className="flex-1 min-w-0">
          {isPending ? (
            <ListingsGridSkeleton />
          ) : initialResult.listings.length > 0 ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-slate-600">
                  <span className="font-bold text-slate-900">{startIndex}-{endIndex}</span> arası gösteriliyor, toplam <span className="font-bold text-slate-900">{initialResult.total}</span> ilan
                </p>
                <div className="flex items-center gap-2 sm:hidden">
                  <span className="text-xs font-semibold text-slate-500">Göster</span>
                  <select
                    value={filters.limit ?? initialResult.limit}
                    onChange={(event) => handleFilterChange("limit", Number(event.target.value))}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-medium text-slate-700 outline-none"
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                  : "flex flex-col gap-3"
              )}>
                {initialResult.listings.map((listing, index) => (
                  <CarCard
                    key={listing.id}
                    listing={listing}
                    priority={viewMode === "grid" ? index < 4 : index < 2}
                    variant={viewMode}
                  />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-500">
                  Sayfa <span className="font-bold text-slate-900">{currentPage}</span> / {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!canGoPrev}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Önceki
                  </button>
                  {buildPageItems(currentPage, totalPages).map((item, index) =>
                    item === "ellipsis" ? (
                      <span key={`ellipsis-${index}`} className="px-2 text-slate-400">…</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => handlePageChange(item)}
                        className={cn(
                          "inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-bold transition",
                          item === currentPage
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        {item}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!canGoNext}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-24 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-slate-50">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-900">Sonuç bulunamadı</h3>
              <p className="mb-6 max-w-sm text-sm text-slate-500">
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

function buildPageItems(currentPage: number, totalPages: number): Array<number | "ellipsis"> {  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis", totalPages]
  }
  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }
  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages]
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
    <div className="flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
      <span>{label}</span>
      <button onClick={onRemove} className="hover:text-blue-800 transition-colors">
        <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

