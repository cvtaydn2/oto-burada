"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Gauge, SlidersHorizontal, Sparkles, TrendingDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { ListingCard } from "@/components/listings/listing-card";
import { ListingsFilterPanel } from "@/components/listings/listings-filter-panel";
import { ListingsGridSkeleton } from "@/components/listings/listings-grid-skeleton";
import {
  createSearchParamsFromListingFilters,
  filterListings,
  getDistrictsForCity,
  getModelsForBrand,
  sortListings,
} from "@/services/listings/listing-filters";
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

  const deferredFilters = useDeferredValue(filters);

  const models = useMemo(
    () => getModelsForBrand(brands, filters.brand),
    [brands, filters.brand],
  );
  const districts = useMemo(
    () => getDistrictsForCity(cities, filters.city),
    [cities, filters.city],
  );

  const filteredListings = useMemo(() => {
    const visibleListings = filterListings(listings, deferredFilters);
    return sortListings(visibleListings, deferredFilters.sort);
  }, [deferredFilters, listings]);

  const isLoading = isPending || deferredFilters !== filters;
  const hasMore = filteredListings.length > visibleCount;
  const smartSummary = useMemo(() => {
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
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
          {/* Header & Smart Context */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Otomobil İlanları</h1>
                <p className="text-base text-slate-500 mt-2">
                  Türkiye genelinde <span className="font-semibold text-slate-900">{filteredListings.length}</span> araç bulundu.
                </p>
              </div>

              <div className="flex items-center gap-3">
                 <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(true)}
                  aria-controls={mobileFilterDialogId}
                  aria-expanded={isFilterDrawerOpen}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 lg:hidden"
                >
                  <SlidersHorizontal className="size-4" />
                  Filtreleri Aç
                </button>
              </div>
            </div>

            {/* AI Context Banner */}
            {smartSummary && (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="text-indigo-600" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-indigo-900 mb-1">Yapay Zeka Özeti</h3>
                  <p className="text-sm text-indigo-800/80 leading-relaxed">
                    Aramanızdaki araçların ortalama fiyatı <span className="font-semibold">{smartSummary.averagePrice.toLocaleString('tr-TR')} TL</span>. 
                    Şu anda piyasa ortalamasının altında yüksek beklentili düşük kilometreli {smartSummary.lowMileageCount} seçenek bulunuyor. 
                    Özellikle {smartSummary.bestPriceListing.title} dikkat çekici fiyat avantajına sahip.
                  </p>
                </div>
              </div>
            )}
            
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
                {filters.maxMileage === 80000 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-primary font-medium">
                    <Gauge className="size-3.5" />
                    Düşük KM
                  </span>
                ) : null}
                {filters.maxPrice === 1_000_000 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-primary font-medium">
                    <TrendingDown className="size-3.5" />
                    Bütçe Dostu
                  </span>
                ) : null}
                {filters.brand ? (
                  <span className="rounded-full bg-muted px-3 py-1.5 font-medium text-slate-700 border border-slate-200">{filters.brand}</span>
                ) : null}
                {filters.city ? (
                  <span className="rounded-full bg-muted px-3 py-1.5 font-medium text-slate-700 border border-slate-200">{filters.city}</span>
                ) : null}
            </div>

          </div>

          {/* Listings List */}
          <div className="pb-24">
            {isLoading ? (
              <ListingsGridSkeleton />
            ) : filteredListings.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-border bg-background p-8 text-center shadow-sm">
                <h2 className="text-xl font-semibold tracking-tight">
                  Aradığın kriterlere uygun ilan bulunamadı.
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                  Filtreleri biraz genişlet veya temizle. Özellikle fiyat ve marka seçimleri sonucu
                  daraltıyor olabilir.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Filtreleri Temizle
                </button>
              </div>
            ) : (
              <div className="flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Table Header Row (Desktop Only) */}
                <div className="hidden border-b border-slate-200 bg-slate-50 px-3 py-3 text-[12px] font-semibold text-slate-500 md:flex md:items-center">
                  <div className="w-[150px] shrink-0 pl-2">Görsel</div>
                  <div className="min-w-0 flex-1 pl-2">Seri / Model / İlan Başlığı</div>
                  <div className="flex shrink-0 items-center">
                    <div className="w-16 text-center">Yıl</div>
                    <div className="w-24 text-right pr-2">KM</div>
                    <div className="w-[88px] text-center">Yakıt</div>
                    <div className="w-[88px] text-center">Vites</div>
                    <div className="w-[130px] pl-4 text-right">Fiyat</div>
                  </div>
                  <div className="w-16 shrink-0 md:ml-4"></div>
                </div>

                {/* Listings */}
                <div className="flex flex-col">
                  {filteredListings.slice(0, visibleCount).map((listing, index) => (
                    <div key={listing.id} className={index !== 0 ? "border-t border-slate-100" : ""}>
                      <ListingCard listing={listing} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isLoading && hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    startTransition(() => {
                      setVisibleCount((current) => current + INITIAL_VISIBLE_COUNT);
                    })
                  }
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                >
                  Daha Fazla Göster
                </button>
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
