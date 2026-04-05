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
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="flex flex-col gap-8">
        <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
                Arabaya göre filtrele
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Sade arama, hızlı sonuç
              </h1>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                Marka, şehir, fiyat ve araç özelliklerine göre filtrele. Karmaşık olmayan bir
                akışla uygun ilanlara birkaç adımda ulaş.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              aria-controls={mobileFilterDialogId}
              aria-expanded={isFilterDrawerOpen}
              className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 lg:hidden"
            >
              <SlidersHorizontal className="size-4" />
              Filtreleri Aç
            </button>
          </div>

          {smartSummary ? (
            <div className="mt-6 rounded-[1.5rem] border border-primary/15 bg-primary/5 p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-background text-primary shadow-sm">
                  <Sparkles className="size-5" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold tracking-tight text-foreground">
                    Akilli sonuc ozeti
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Bu filtrede ortalama fiyat {smartSummary.averagePrice.toLocaleString("tr-TR")} TL.
                    Dusuk kilometreli {smartSummary.lowMileageCount} ilan ve otomatik vitesli{" "}
                    {smartSummary.automaticCount} ilan var. En erisilebilir secenek su an{" "}
                    <span className="font-semibold text-foreground">
                      {smartSummary.bestPriceListing.title}
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
          <aside className="hidden lg:block">
            <ListingsFilterPanel
              brands={brands}
              cities={cities}
              filters={filters}
              models={getModelsForBrand(brands, filters.brand)}
              districts={getDistrictsForCity(cities, filters.city)}
              quickPresets={QUICK_PRESETS.map((preset) => ({ ...preset }))}
              onApplyPreset={applyQuickPreset}
              onFilterChange={updateFilter}
              onReset={resetFilters}
            />
          </aside>

          <section className="space-y-5">
            <div className="flex flex-col gap-3 rounded-[1.5rem] border border-border/80 bg-background p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Görüntülenen sonuç</p>
                <p className="text-lg font-semibold tracking-tight" aria-live="polite">
                  {filteredListings.length} ilan bulundu
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {filters.maxMileage === 80000 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-primary">
                    <Gauge className="size-3.5" />
                    Dusuk KM
                  </span>
                ) : null}
                {filters.maxPrice === 1_000_000 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-primary">
                    <TrendingDown className="size-3.5" />
                    Butce Dostu
                  </span>
                ) : null}
                {filters.brand ? (
                  <span className="rounded-full bg-muted px-3 py-1.5">{filters.brand}</span>
                ) : null}
                {filters.city ? (
                  <span className="rounded-full bg-muted px-3 py-1.5">{filters.city}</span>
                ) : null}
                {filters.transmission ? (
                  <span className="rounded-full bg-muted px-3 py-1.5">{filters.transmission}</span>
                ) : null}
                {filters.fuelType ? (
                  <span className="rounded-full bg-muted px-3 py-1.5">{filters.fuelType}</span>
                ) : null}
              </div>
            </div>

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
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredListings.slice(0, visibleCount).map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>

                {hasMore ? (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        startTransition(() => {
                          setVisibleCount((current) => current + INITIAL_VISIBLE_COUNT);
                        })
                      }
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      Daha Fazla Göster
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>
      </div>

      {isFilterDrawerOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/45 px-4 py-6 lg:hidden"
          onClick={() => setIsFilterDrawerOpen(false)}
        >
          <div className="mx-auto max-w-lg">
            <div
              id={mobileFilterDialogId}
              role="dialog"
              aria-modal="true"
              aria-labelledby={mobileFilterTitleId}
              className="space-y-3"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sr-only">
                <h2 id={mobileFilterTitleId}>Mobil filtre paneli</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="rounded-xl bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
