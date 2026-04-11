"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Gauge, LayoutGrid, List, Search, SlidersHorizontal, TrendingDown, Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Drawer } from "vaul";

import { ListingCard } from "@/components/listings/listing-card";
import { ListingCardGrid } from "@/components/listings/listing-card-grid";
import { ListingsFilterPanel } from "@/components/listings/listings-filter-panel";
import { ListingsGridSkeleton } from "@/components/listings/listings-grid-skeleton";
import { SaveSearchButton } from "@/components/listings/save-search-button";
import {
  createSearchParamsFromListingFilters,
  getDistrictsForCity,
  getModelsForBrand,
} from "@/services/listings/listing-filters";
import type { BrandCatalogItem, CityOption, Listing, ListingFilters } from "@/types";
import type { PaginatedListingsResult } from "@/services/listings/listing-submissions";

const QUICK_PRESETS = [
  {
    description: "80.000 km altındaki ilanları en düşük kilometreden başlat.",
    id: "low-mileage",
    label: "Düşük KM",
  },
  {
    description: "Otomatik vites ilanları tek dokunuşla filtrele.",
    id: "automatic",
    label: "Otomatik",
  },
  {
    description: "1.000.000 TL altındaki daha erişilebilir araçları öne çıkar.",
    id: "budget",
    label: "Bütçe Dostu",
  },
  {
    description: "2020 ve sonrası araçları yeni model odağıyla listele.",
    id: "newer-models",
    label: "Yeni Model",
  },
] as const;

interface ListingsPageClientProps {
  initialResult: PaginatedListingsResult;
  brands: BrandCatalogItem[];
  cities: CityOption[];
  initialFilters: ListingFilters;
  userId?: string | null;
  hideHero?: boolean;
}

export function ListingsPageClient({
  initialResult,
  brands,
  cities,
  initialFilters,
  userId,
  hideHero = false,
}: ListingsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<ListingFilters>(initialFilters);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  // Accumulated listings for "Load More" functionality
  const [accumulatedListings, setAccumulatedListings] = useState<Listing[]>(initialResult.listings);
  const [currentPage, setCurrentPage] = useState(initialResult.page);
  const [hasMore, setHasMore] = useState(initialResult.hasMore);
  const [totalCount, setTotalCount] = useState(initialResult.total);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Sync internal listings state if initialResult changes (new search from server)
  useEffect(() => {
    setAccumulatedListings(initialResult.listings);
    setCurrentPage(initialResult.page);
    setHasMore(initialResult.hasMore);
    setTotalCount(initialResult.total);
    setFilters(initialFilters);
  }, [initialResult, initialFilters]);

  const isHomePage = (pathname === "/" || pathname === "/listings") && !hideHero;

  const models = useMemo(
    () => getModelsForBrand(brands, filters.brand),
    [brands, filters.brand],
  );
  const districts = useMemo(
    () => getDistrictsForCity(cities, filters.city),
    [cities, filters.city],
  );

  const syncFiltersToUrl = useCallback((nextFilters: ListingFilters) => {
    const params = createSearchParamsFromListingFilters(nextFilters);
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    
    startTransition(() => {
      router.replace(newUrl, { scroll: false });
    });
  }, [pathname, router]);

  const updateFilter = useCallback(<K extends keyof ListingFilters>(
    key: K,
    value: ListingFilters[K],
  ) => {
    const nextFilters: ListingFilters = {
      ...filters,
      [key]: value,
      page: 1,
    };

    if (key === "brand") nextFilters.model = undefined;
    if (key === "city") nextFilters.district = undefined;

    setFilters(nextFilters);
    syncFiltersToUrl(nextFilters);
  }, [filters, syncFiltersToUrl]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    const nextFilters = { ...filters, page: nextPage };
    const params = createSearchParamsFromListingFilters(nextFilters);
    
    try {
      const response = await fetch(`/api/listings?${params.toString()}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const result = data.data as PaginatedListingsResult;
        setAccumulatedListings(prev => [...prev, ...result.listings]);
        setCurrentPage(result.page);
        setHasMore(result.hasMore);
      }
    } catch (error) {
      console.error("Load more error:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const resetFilters = () => {
    const nextFilters: ListingFilters = { sort: "newest", page: 1 };
    setFilters(nextFilters);
    syncFiltersToUrl(nextFilters);
  };

  const applyQuickPreset = (presetId: string) => {
    const nextFilters: ListingFilters = { sort: "newest", page: 1 };

    if (presetId === "low-mileage") {
      nextFilters.maxMileage = 80000;
      nextFilters.sort = "mileage_asc";
    } else if (presetId === "automatic") {
      nextFilters.transmission = "otomatik";
    } else if (presetId === "budget") {
      nextFilters.maxPrice = 1_000_000;
      nextFilters.sort = "price_asc";
    } else if (presetId === "newer-models") {
      nextFilters.minYear = 2020;
      nextFilters.sort = "year_desc";
    }

    setFilters(nextFilters);
    syncFiltersToUrl(nextFilters);
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Hero Section */}
      {isHomePage && (
        <section className="mb-10">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-500 px-6 py-12 sm:px-10 sm:py-16 lg:py-20">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
            <div className="relative z-10 mx-auto max-w-3xl text-center">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">Hayalindeki Arabayı Bul</h1>
              <p className="mt-4 text-lg text-indigo-100 sm:text-xl">Türkiye&apos;nin en güvenilir 2. el ve sıfır otomobil pazarı.</p>
              
              <div className="mt-10 mx-auto max-w-xl">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="size-5 text-indigo-300 group-focus-within:text-white transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Marka, model veya ilan başlığı ara..."
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all backdrop-blur-md"
                    value={filters.query || ""}
                    onChange={(e) => updateFilter("query", e.target.value)}
                  />
                  {isPending && (
                    <div className="absolute inset-y-0 right-4 flex items-center">
                      <Loader2 className="animate-spin text-white/50" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-2">
                <span className="w-full text-xs font-semibold text-indigo-200 uppercase tracking-widest mb-2">Popüler Markalar</span>
                {brands.slice(0, 6).map((brand) => (
                  <button
                    key={brand.brand}
                    onClick={() => updateFilter("brand", brand.brand)}
                    className="inline-flex items-center rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-105 border border-white/5 shadow-sm"
                  >
                    {brand.brand}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Page Content */}
      {!isHomePage && (
        <section className="mb-8 p-6 rounded-3xl bg-white border border-slate-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Otomobil İlanları</h1>
              <p className="text-sm text-slate-500 mt-1"><span className="font-semibold text-slate-900">{totalCount}</span> ilan sizin için listeleniyor</p>
            </div>
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="İlanlar içinde ara..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  value={filters.query || ""}
                  onChange={(e) => updateFilter("query", e.target.value)}
                />
                {isPending && (
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <Loader2 className="animate-spin text-indigo-500" size={16} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block lg:w-[280px] flex-shrink-0">
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
              disabled={isPending}
            />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
              {isHomePage && (
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">İlanlar</h2>
                  <p className="text-sm text-slate-500 mt-1.5">{totalCount} araç bulundu.</p>
                </div>
              )}
              <div className="flex-1 flex justify-end">
                <SaveSearchButton filters={filters} resultCount={totalCount} userId={userId} />
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                  <button onClick={() => setViewMode("list")} className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"}`}><List size={18} /></button>
                  <button onClick={() => setViewMode("grid")} className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"}`}><LayoutGrid size={18} /></button>
                </div>
                <button onClick={() => setIsFilterDrawerOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 lg:hidden">
                  <SlidersHorizontal className="size-4" /> Filtrele
                </button>
              </div>
            </div>
          </div>

          <div className="pb-20 relative">
            {isPending && !isLoadingMore && (
              <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
              </div>
            )}
            
            {accumulatedListings.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
                <Search className="mx-auto size-8 text-slate-400 mb-4" />
                <h2 className="text-xl font-bold text-slate-900">İlan bulunamadı</h2>
                <button onClick={resetFilters} className="mt-6 inline-flex h-11 items-center rounded-xl bg-indigo-500 px-6 text-sm font-semibold text-white">Filtreleri Temizle</button>
              </div>
            ) : (
              <>
                {viewMode === "list" ? (
                  <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="hidden border-b border-slate-200 bg-slate-50 px-3 py-3 text-[12px] font-semibold text-slate-500 md:flex md:items-center">
                      <div className="w-[150px] shrink-0 pl-2">Görsel</div>
                      <div className="min-w-0 flex-1 pl-2">Seri / Model</div>
                      <div className="flex shrink-0 items-center">
                        <div className="w-16 text-center">Yıl</div>
                        <div className="w-24 text-right pr-2">KM</div>
                        <div className="w-[88px] text-center">Yakıt</div>
                        <div className="w-[88px] text-center">Vites</div>
                        <div className="w-[130px] pl-4 text-right">Fiyat</div>
                      </div>
                      <div className="w-16 shrink-0 md:ml-4"></div>
                    </div>
                    {accumulatedListings.map((listing, index) => (
                      <div key={`${listing.id}-${index}`} className={index !== 0 ? "border-t border-slate-100" : ""}>
                        <ListingCard listing={listing} priority={index < 4} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {accumulatedListings.map((listing, index) => (
                      <ListingCardGrid key={`${listing.id}-${index}`} listing={listing} priority={index < 4} />
                    ))}
                  </div>
                )}
              </>
            )}

            {hasMore && (
              <div className="mt-8 flex flex-col items-center gap-4">
                <p className="text-sm text-slate-500"><span className="font-medium text-slate-700">{accumulatedListings.length}</span> / {totalCount} araç gösteriliyor</p>
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore || isPending}
                  className="inline-flex h-11 items-center rounded-xl bg-indigo-500 px-8 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isLoadingMore && <Loader2 className="animate-spin mr-2" size={18} />}
                  Daha Fazla Göster
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Drawer.Root open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-[90%] flex-col rounded-t-[32px] bg-white lg:hidden">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-slate-200" />
              <Drawer.Title className="text-xl font-bold text-slate-900 px-2 mb-4">Filtrele</Drawer.Title>
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
                disabled={isPending}
              />
            </div>
            <div className="p-4 border-t">
              <button onClick={() => setIsFilterDrawerOpen(false)} className="flex w-full h-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold">Sonuçları Gör</button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </main>
  );
}
