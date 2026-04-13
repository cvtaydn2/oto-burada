"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { LayoutGrid, List, ArrowDownUp, Star, BadgeCheck, TrendingDown } from "lucide-react"

import { type Listing, type ListingFilters, type BrandCatalogItem, type CityOption } from "@/types"
import { CarCard } from "@/components/modules/listings/car-card"
import { SmartFilters } from "@/components/modules/listings/smart-filters"
import { ListingsGridSkeleton } from "@/components/listings/listings-grid-skeleton"
import { MobileFilterDrawer } from "@/components/ui/mobile-filter-drawer"
import { cn } from "@/lib/utils"

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
}: ListingsPageClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [filters, setFilters] = useState<ListingFilters>(initialFilters)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isSortOpen, setIsSortOpen] = useState(false)

  const activeFiltersCount = Object.entries(filters).filter(([key, val]) => {
    if (key === "limit" || key === "offset" || key === "sort") return false
    return val !== undefined && val !== ""
  }).length

  const filteredModels = (brands.find(b => b.brand === filters.brand)?.models || []).map(m => m.name);
  const filteredTrims = (brands.find(b => b.brand === filters.brand)?.models?.find(m => m.name === filters.model)?.trims || []);
  const filteredDistricts = (cities.find(c => c.city === filters.city)?.districts || []);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFilterChange = <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)

    if (key === "sort") {
      applyFilters(newFilters, true)
      return
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      applyFilters(newFilters)
    }, 400)
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

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === filters.sort)?.label || "En Yeni"

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
              onFilterChange={handleFilterChange}
              onReset={handleReset}
              activeCount={activeFiltersCount}
            />

            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex h-8 items-center justify-center rounded-md px-2.5 transition-colors",
                  viewMode === "grid"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex h-8 items-center justify-center rounded-md px-2.5 transition-colors",
                  viewMode === "list"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <List size={16} />
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ArrowDownUp size={16} />
                <span className="hidden sm:inline">{currentSortLabel}</span>
                <ChevronIcon className={cn("transition-transform size-4", isSortOpen && "rotate-180")} />
              </button>

              {isSortOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        handleFilterChange("sort", option.value as ListingFilters["sort"]);
                        setIsSortOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2 text-left text-sm transition-colors",
                        filters.sort === option.value
                          ? "bg-blue-50 font-bold text-blue-600"
                          : "text-gray-600 hover:bg-gray-50"
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

        {/* Quick Filter Chips */}
        <div className="mt-5 flex flex-wrap gap-2.5">
          {QUICK_FILTERS.map((qf) => {
            const isActive =
              (qf.type === "reset" && !filters.hasExpertReport && filters.sort !== "price_asc" && filters.sort !== "newest") ||
              (qf.type === "expert" && filters.hasExpertReport === true) ||
              (qf.type === "price_low" && filters.sort === "price_asc") ||
              (qf.type === "newest" && filters.sort === "newest")

            return (
              <button
                key={qf.label}
                onClick={() => {
                  if (qf.type === "reset") handleReset()
                  else if (qf.type === "expert") handleFilterChange("hasExpertReport", filters.hasExpertReport ? undefined : true)
                  else if (qf.type === "price_low") handleFilterChange("sort", filters.sort === "price_asc" ? undefined : "price_asc")
                  else if (qf.type === "newest") handleFilterChange("sort", filters.sort === "newest" ? undefined : "newest")
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-all",
                  qf.type === "price_low" && filters.sort === "price_asc"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm"
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
              <FilterTag label={filters.brand} onRemove={() => handleFilterChange("brand", undefined)} />
            )}
            {filters.model && (
              <FilterTag label={filters.model} onRemove={() => handleFilterChange("model", undefined)} />
            )}
            {filters.city && (
              <FilterTag label={filters.city} onRemove={() => handleFilterChange("city", undefined)} />
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
                onRemove={() => { handleFilterChange("minPrice", undefined); handleFilterChange("maxPrice", undefined) }}
              />
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
            <div className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                : "flex flex-col gap-3"
            )}>
              {initialResult.listings.map((listing, index) => (
                <CarCard
                  key={listing.id}
                  listing={listing}
                  priority={index < 3}
                  variant={viewMode}
                />
              ))}
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

function formatTL(value: number): string {
  if (value >= 1_000_000) return `₺${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `₺${(value / 1_000).toFixed(0)}K`
  return `₺${value}`
}
