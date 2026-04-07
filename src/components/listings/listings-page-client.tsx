"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Gauge, LayoutGrid, List, Search, SlidersHorizontal, TrendingDown, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

import { ListingCard } from "@/components/listings/listing-card";
import { ListingCardGrid } from "@/components/listings/listing-card-grid";
import { ListingsFilterPanel } from "@/components/listings/listings-filter-panel";
import { ListingsGridSkeleton } from "@/components/listings/listings-grid-skeleton";
import {
  createSearchParamsFromListingFilters,
  filterListings,
  getDistrictsForCity,
  getModelsForBrand,
  sortListings,
} from "@/services/listings/listing-filters";
import { brandCatalog, cityOptions } from "@/data";
import type { BrandCatalogItem, CityOption } from "@/data";
import type { Listing, ListingFilters } from "@/types";

const INITIAL_VISIBLE_COUNT = 6;
const QUICK_PRESETS = [
  {
    description: "80.000 km altindaki ilanlari en dusuk kilometreden baslat.",
    id: "low-mileage",
    label: "Dusuk KM",
  },
  {
    description: "Otomatik vites ilanlari tek dokunusla filtrele.",
    id: "automatic",
    label: "Otomatik",
  },
  {
    description: "1.000.000 TL altindaki daha erisilebilir araclari one cikar.",
    id: "budget",
    label: "Butce Dostu",
  },
  {
    description: "2020 ve sonrasi araclari yeni model odagiyla listele.",
    id: "newer-models",
    label: "Yeni Model",
  },
] as const;

interface ListingsPageClientProps {
  listings: Listing[];
  brands: BrandCatalogItem[];
  cities: CityOption[];
  initialFilters: ListingFilters;
}

export function ListingsPageClient({
  listings,
  brands,
  cities,
  initialFilters,
}: ListingsPageClientProps) {
  const mobileFilterDialogId = "mobile-listing-filters";
  const mobileFilterTitleId = "mobile-listing-filters-title";
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<ListingFilters>(initialFilters);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const deferredFilters = useDeferredValue(filters);
  const isHomePage = pathname === "/" || pathname === "/listings";

  const models = useMemo(
    () => getModelsForBrand(brands, filters.brand),
    [brands, filters.brand],
  );
  const districts = useMemo(
    () => getDistrictsForCity(cities, filters.city),
    [cities, filters.city],
  );

  const filteredListings = useMemo(() => {
    let visibleListings = filterListings(listings, deferredFilters);
    visibleListings = sortListings(visibleListings, deferredFilters.sort);
    
    if (sortColumn) {
      visibleListings = [...visibleListings].sort((a, b) => {
        let aVal: string | number, bVal: string | number;
        switch (sortColumn) {
          case "title":
            aVal = `${a.brand} ${a.model} ${a.title}`.toLowerCase();
            bVal = `${b.brand} ${b.model} ${b.title}`.toLowerCase();
            break;
          case "year":
            aVal = a.year;
            bVal = b.year;
            break;
          case "mileage":
            aVal = a.mileage;
            bVal = b.mileage;
            break;
          case "price":
            aVal = a.price;
            bVal = b.price;
            break;
          default:
            return 0;
        }
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    
    return visibleListings;
  }, [deferredFilters, listings, sortColumn, sortDirection]);

  const isLoading = isPending || deferredFilters !== filters;
  const hasMore = filteredListings.length > visibleCount;
  
  // Smart summary for future UI feature
  const _smartSummary = useMemo(() => {
    if (filteredListings.length === 0) {
      return null;
    }

    const averagePrice = Math.round(
      filteredListings.reduce((sum, listing) => sum + listing.price, 0) / filteredListings.length,
    );
    const lowMileageCount = filteredListings.filter((listing) => listing.mileage <= 80000).length;
    const automaticCount = filteredListings.filter(
      (listing) => listing.transmission === "otomatik" || listing.transmission === "yari_otomatik",
    ).length;
    const bestPriceListing = [...filteredListings].sort((left, right) => left.price - right.price)[0];

    return {
      automaticCount,
      averagePrice,
      bestPriceListing,
      lowMileageCount,
    };
  }, [filteredListings]);

  useEffect(() => {
    if (!isFilterDrawerOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFilterDrawerOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFilterDrawerOpen]);

  const syncFiltersToUrl = (nextFilters: ListingFilters) => {
    const searchParams = createSearchParamsFromListingFilters(nextFilters);
    const nextUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

    router.replace(nextUrl, { scroll: false });
  };

  const updateFilter = <K extends keyof ListingFilters>(
    key: K,
    value: ListingFilters[K],
  ) => {
    startTransition(() => {
      setFilters((current) => {
        const nextFilters: ListingFilters = {
          ...current,
          [key]: value,
        };

        if (key === "brand") {
          nextFilters.model = undefined;
        }

        if (key === "city") {
          nextFilters.district = undefined;
        }

        syncFiltersToUrl(nextFilters);
        return nextFilters;
      });
      setVisibleCount(INITIAL_VISIBLE_COUNT);
    });
  };

  const resetFilters = () => {
    startTransition(() => {
      const nextFilters: ListingFilters = {
        sort: "newest",
      };
      setFilters(nextFilters);
      setVisibleCount(INITIAL_VISIBLE_COUNT);
      syncFiltersToUrl(nextFilters);
    });
  };

  const applyQuickPreset = (presetId: string) => {
    startTransition(() => {
      const nextFilters: ListingFilters = {
        sort: "newest",
      };

      if (presetId === "low-mileage") {
        nextFilters.maxMileage = 80000;
        nextFilters.sort = "mileage_asc";
      }

      if (presetId === "automatic") {
        nextFilters.transmission = "otomatik";
      }

      if (presetId === "budget") {
        nextFilters.maxPrice = 1_000_000;
        nextFilters.sort = "price_asc";
      }

      if (presetId === "newer-models") {
        nextFilters.minYear = 2020;
        nextFilters.sort = "year_desc";
      }

      setFilters(nextFilters);
      setVisibleCount(INITIAL_VISIBLE_COUNT);
      syncFiltersToUrl(nextFilters);
    });
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Hero Section - Only show when no filters applied */}
      {isHomePage && (
        <section className="mb-10">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-500 px-6 py-12 sm:px-10 sm:py-16 lg:py-20">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
            
            <div className="relative z-10 mx-auto max-w-3xl text-center">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Hayalindeki Arabayı Bul
              </h1>
              <p className="mt-4 text-lg text-indigo-100 sm:text-xl">
                Turkiye nin en guvenilir 2. el ve sifir otomobil pazarı. 
                Binlerce ara tek tik uzakta.
              </p>
              
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {brandCatalog.slice(0, 5).map((brand) => (
                  <Link
                    key={brand.brand}
                    href={`/listings?brand=${encodeURIComponent(brand.brand)}`}
                    className="inline-flex items-center rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/30 hover:scale-105"
                  >
                    {brand.brand}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
              <p className="text-2xl font-bold text-indigo-600">{listings.length}+</p>
              <p className="text-xs font-medium text-slate-500">İlan</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
              <p className="text-2xl font-bold text-emerald-600">{brandCatalog.length}</p>
              <p className="text-xs font-medium text-slate-500">Marka</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
              <p className="text-2xl font-bold text-amber-600">{cityOptions.length}</p>
              <p className="text-xs font-medium text-slate-500">Şehir</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
              <p className="text-2xl font-bold text-blue-600">%100</p>
              <p className="text-xs font-medium text-slate-500">Ücretsiz</p>
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Smart Sidebar Filters */}
        <aside className="w-full lg:w-[280px] flex-shrink-0">
          <div className="sticky top-24">
            <ListingsFilterPanel
              brands={brands}
              cities={cities}
              filters={filters}
              models={models}
              districts={districts}
              quickPresets={QUICK_PRESETS.map((preset) => ({ ...preset }))}
              onApplyPreset={applyQuickPreset}
              onFilterChange={updateFilter}
              onReset={resetFilters}
            />
          </div>
        </aside>

        {/* Main Listing Area */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {isHomePage ? "Tüm İlanlar" : "Otomobil İlanları"}
                </h1>
                <p className="text-sm text-slate-500 mt-1.5">
                  <span className="font-semibold text-slate-900">{filteredListings.length}</span> araç bulundu
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="hidden sm:flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
                    title="Liste görünümü"
                  >
                    <List size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
                    title="Izgara görünümü"
                  >
                    <LayoutGrid size={18} />
                  </button>
                </div>

                {/* Items per page */}
                <select
                  value={INITIAL_VISIBLE_COUNT}
                  onChange={(e) => {
                    startTransition(() => {
                      setVisibleCount(Number(e.target.value));
                    });
                  }}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500 hidden sm:block"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                  <option value={96}>96</option>
                </select>

                 <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(true)}
                  aria-controls={mobileFilterDialogId}
                  aria-expanded={isFilterDrawerOpen}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-md lg:hidden"
                >
                  <SlidersHorizontal className="size-4" />
                  Filtrele
                </button>
              </div>
            </div>

            {/* Active Filters Chips */}
            <div className="mt-4 flex flex-wrap gap-2">
                {filters.maxMileage === 80000 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
                    <Gauge className="size-3.5" />
                    Düşük KM
                  </span>
                ) : null}
                {filters.maxPrice === 1_000_000 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-100">
                    <TrendingDown className="size-3.5" />
                    Bütçe Dostu
                  </span>
                ) : null}
                {filters.brand ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200">
                    {filters.brand}
                  </span>
                ) : null}
                {filters.city ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200">
                    {filters.city}
                  </span>
                ) : null}
            </div>

          </div>

          {/* Listings Grid */}
          <div className="pb-20">
            {isLoading ? (
              <ListingsGridSkeleton />
            ) : filteredListings.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Search className="size-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  İlan bulunamadı
                </h2>
                <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                  Aradığın kriterlere uygun araç bulunamadı. Filtreleri temizleyip yeniden dene.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-indigo-500 px-6 text-sm font-semibold text-white transition-all hover:bg-indigo-600 hover:shadow-lg shadow-indigo-500/25"
                >
                  Filtreleri Temizle
                </button>
              </div>
            ) : (
              <>
                {/* View Toggle Mobile */}
                <div className="flex items-center justify-between mb-4 sm:hidden">
                  <span className="text-sm text-slate-500">
                    {filteredListings.length} araç
                  </span>
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"}`}
                    >
                      <List size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"}`}
                    >
                      <LayoutGrid size={16} />
                    </button>
                  </div>
                </div>

                {viewMode === "list" ? (
                  <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    {/* Table Header Row with Sorting */}
                    <div className="hidden border-b border-slate-200 bg-slate-50 px-3 py-3 text-[12px] font-semibold text-slate-500 md:flex md:items-center">
                      <div className="w-[150px] shrink-0 pl-2">Görsel</div>
                      <button
                        onClick={() => {
                          setSortColumn("title");
                          setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                        }}
                        className="min-w-0 flex-1 pl-2 flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        Seri / Model
                        {sortColumn === "title" ? (
                          sortDirection === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                        ) : <ArrowUpDown size={12} className="opacity-50" />}
                      </button>
                      <div className="flex shrink-0 items-center">
                        <button
                          onClick={() => {
                            setSortColumn("year");
                            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                          }}
                          className="w-16 text-center flex items-center justify-center gap-1 hover:text-indigo-600 transition-colors"
                        >
                          Yıl
                          {sortColumn === "year" ? (
                            sortDirection === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                          ) : <ArrowUpDown size={12} className="opacity-50" />}
                        </button>
                        <button
                          onClick={() => {
                            setSortColumn("mileage");
                            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                          }}
                          className="w-24 text-right pr-2 flex items-center justify-end gap-1 hover:text-indigo-600 transition-colors"
                        >
                          KM
                          {sortColumn === "mileage" ? (
                            sortDirection === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                          ) : <ArrowUpDown size={12} className="opacity-50" />}
                        </button>
                        <div className="w-[88px] text-center">Yakıt</div>
                        <div className="w-[88px] text-center">Vites</div>
                        <button
                          onClick={() => {
                            setSortColumn("price");
                            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                          }}
                          className="w-[130px] pl-4 text-right flex items-center justify-end gap-1 hover:text-indigo-600 transition-colors"
                        >
                          Fiyat
                          {sortColumn === "price" ? (
                            sortDirection === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                          ) : <ArrowUpDown size={12} className="opacity-50" />}
                        </button>
                      </div>
                      <div className="w-16 shrink-0 md:ml-4"></div>
                    </div>

                    {/* Listings */}
                    <div className="flex flex-col">
                      {filteredListings.slice(0, visibleCount).map((listing, index) => (
                        <div key={listing.id} className={index !== 0 ? "border-t border-slate-100" : ""}>
                          <ListingCard listing={listing} priority={index < 4} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredListings.slice(0, visibleCount).map((listing, index) => (
                      <ListingCardGrid key={listing.id} listing={listing} priority={index < 4} />
                    ))}
                  </div>
                )}
              </>
            )}

            {!isLoading && hasMore && (
              <div className="mt-8 space-y-4">
                <p className="text-center text-sm text-slate-500">
                  <span className="font-medium text-slate-700">{visibleCount}</span> / {filteredListings.length} araç gösteriliyor
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(() => {
                        setVisibleCount((current) => current + INITIAL_VISIBLE_COUNT);
                      })
                    }
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-500 px-8 text-sm font-semibold text-white transition-all hover:bg-indigo-600 hover:shadow-lg shadow-indigo-500/25"
                  >
                    Daha Fazla Göster
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isFilterDrawerOpen ? (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm px-4 py-6 lg:hidden"
          onClick={() => setIsFilterDrawerOpen(false)}
        >
          <div className="mx-auto max-w-lg h-full overflow-y-auto">
            <div
              id={mobileFilterDialogId}
              role="dialog"
              aria-modal="true"
              aria-labelledby={mobileFilterTitleId}
              className="space-y-3 relative"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sr-only">
                <h2 id={mobileFilterTitleId}>Mobil filtre paneli</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                 Kapat
              </button>
              <ListingsFilterPanel
                brands={brands}
                cities={cities}
                filters={filters}
                models={models}
                districts={districts}
                isMobile
                quickPresets={QUICK_PRESETS.map((preset) => ({ ...preset }))}
                onApplyPreset={applyQuickPreset}
                onFilterChange={updateFilter}
                onReset={resetFilters}
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
