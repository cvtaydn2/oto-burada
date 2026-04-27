"use client";

import { BadgeCheck, RefreshCcw, Search, Star, TrendingDown } from "lucide-react";
import { useRef } from "react";
import { useEffect } from "react";

import { ListingsGridSkeleton } from "@/components/listings/listings-grid-skeleton";
import { ListingCard } from "@/components/shared/listing-card";
import { ActiveFilterTags } from "@/features/marketplace/components/active-filter-tags";
import { MarketplaceControls } from "@/features/marketplace/components/marketplace-controls";
import { MarketplaceHeader } from "@/features/marketplace/components/marketplace-header";
import { MarketplaceSidebar } from "@/features/marketplace/components/marketplace-sidebar";
// Marketplace Feature Components/Hooks
import { useMarketplaceLogic } from "@/features/marketplace/hooks/use-marketplace-logic";
import { marketplace } from "@/lib/constants/ui-strings";
import { cn } from "@/lib/utils";
import { type BrandCatalogItem, type CityOption, type Listing, type ListingFilters } from "@/types";

const QUICK_FILTERS = [
  { label: marketplace.quickFilters.all, type: "reset" as const, icon: null },
  { label: marketplace.quickFilters.expert, type: "expert" as const, icon: BadgeCheck },
  { label: marketplace.quickFilters.priceDrop, type: "price_low" as const, icon: TrendingDown },
  { label: marketplace.quickFilters.newest, type: "newest" as const, icon: Star },
];

const PAGE_SIZE_OPTIONS = [12, 24, 48];

interface ListingsPageClientProps {
  initialResult: {
    listings: Listing[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  brands: BrandCatalogItem[];
  cities: CityOption[];
  initialFilters: ListingFilters;
  userId?: string;
}

export function ListingsPageClient({
  initialResult,
  brands,
  cities,
  initialFilters,
  userId,
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
    applyFilters,
    isError,
    error,
  } = useMarketplaceLogic({ initialResult, initialFilters });

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchNextPage();
      },
      { rootMargin: "200px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const isInitialPage = allListings.length === initialResult.listings.length;

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 py-6 sm:py-8 bg-background min-h-screen">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
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

        <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
          {QUICK_FILTERS.map((qf) => {
            const isActive =
              (qf.type === "expert" && filters.hasExpertReport === true) ||
              (qf.type === "price_low" && filters.sort === "price_asc") ||
              (qf.type === "newest" && (filters.sort === "newest" || !filters.sort));

            return (
              <button
                key={qf.label}
                onClick={() => {
                  if (qf.type === "reset") handleReset();
                  else if (qf.type === "expert")
                    handleFilterChange(
                      "hasExpertReport",
                      filters.hasExpertReport ? undefined : true
                    );
                  else if (qf.type === "price_low")
                    handleFilterChange(
                      "sort",
                      filters.sort === "price_asc" ? "newest" : "price_asc"
                    );
                  else if (qf.type === "newest") handleFilterChange("sort", "newest");
                }}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 rounded-full border px-4 sm:px-6 py-2 sm:py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95",
                  qf.type === "reset"
                    ? "border-border bg-card text-muted-foreground hover:border-foreground hover:text-foreground"
                    : isActive
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-muted-foreground hover:border-foreground hover:text-foreground"
                )}
              >
                {qf.icon && <qf.icon size={12} strokeWidth={3} />}
                {qf.label}
              </button>
            );
          })}
        </div>

        {filters.validationError && (
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/50 p-4 text-xs text-amber-700 font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <Search size={14} className="shrink-0" />
            {filters.validationError}
          </div>
        )}

        <ActiveFilterTags
          filters={filters}
          handleFilterChange={handleFilterChange}
          handleReset={handleReset}
          applyFilters={applyFilters}
          setFilters={setFilters}
        />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <MarketplaceSidebar
          brands={brands}
          cities={cities}
          filters={filters}
          isPending={isPending}
          activeFiltersCount={activeFiltersCount}
          handleFilterChange={handleFilterChange}
          handleReset={handleReset}
        />

        <div className="flex-1 min-w-0">
          {isError ? (
            // UX FIX: Show recoverable error state instead of blank/loading
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 sm:py-24 px-4">
              <div className="mb-4 flex size-12 sm:size-16 items-center justify-center rounded-full bg-red-50">
                <RefreshCcw size={28} className="text-red-500" />
              </div>
              <h3 className="mb-2 text-base sm:text-lg font-bold text-foreground tracking-tight">
                İlanlar yüklenirken hata oluştu
              </h3>
              <p className="mb-6 sm:mb-8 max-w-sm text-sm text-muted-foreground text-center">
                {error instanceof Error ? error.message : "Bağlantı sırasında bir sorun oluştu."}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="h-10 sm:h-12 rounded-xl bg-primary px-8 sm:px-10 text-xs sm:text-sm font-bold text-primary-foreground hover:opacity-90 transition-all shadow-sm uppercase tracking-widest flex items-center gap-2"
              >
                <RefreshCcw size={14} />
                Sayfayı Yenile
              </button>
            </div>
          ) : isPending ? (
            <div className="bg-card rounded-2xl p-6 sm:p-10 border border-border shadow-sm min-h-[400px] sm:min-h-[600px]">
              <ListingsGridSkeleton />
            </div>
          ) : allListings.length > 0 ? (
            <div className="space-y-6 sm:space-y-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-muted/30 p-4 sm:p-6">
                <p className="text-sm font-medium text-muted-foreground">
                  <span className="text-foreground font-bold">{total.toLocaleString("tr-TR")}</span>{" "}
                  {total === 1 ? "ilan" : "ilan"} arasından{" "}
                  <span className="text-foreground font-bold">{allListings.length}</span>{" "}
                  {allListings.length === 1 ? "gösteriliyor" : "gösteriliyor"}
                </p>
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                    Sayfa:
                  </span>
                  <select
                    value={filters.limit ?? initialResult.limit}
                    onChange={(event) => handleFilterChange("limit", Number(event.target.value))}
                    className="h-9 min-w-[70px] rounded-lg border border-border bg-card px-2 sm:px-3 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                className={cn(
                  "relative transition-opacity duration-normal",
                  isPending ? "opacity-50 pointer-events-none" : "opacity-100",
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
                    : "flex flex-col gap-4"
                )}
              >
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

              <div ref={loadMoreRef} className="py-8 flex justify-center">
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-muted/50">
                    <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <span className="text-sm font-medium text-muted-foreground">Yükleniyor...</span>
                  </div>
                ) : hasNextPage ? (
                  <button
                    onClick={() => fetchNextPage()}
                    className="h-11 px-8 rounded-full border-2 border-border bg-card text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
                  >
                    Daha Fazla Göster
                  </button>
                ) : allListings.length > 0 ? (
                  <p className="text-sm font-medium text-muted-foreground/70">
                    Tüm ilanları görüntülediniz
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 sm:py-24 px-4">
              <div className="mb-4 flex size-12 sm:size-16 items-center justify-center rounded-full bg-muted/40">
                <Search size={28} className="text-muted-foreground/50" />
              </div>
              <h3 className="mb-2 text-base sm:text-lg font-bold text-foreground tracking-tight">
                Sonuç bulunamadı
              </h3>
              <p className="mb-6 sm:mb-8 max-w-sm text-sm text-muted-foreground">
                Aradığınız kriterlere uygun araç bulunamadı.
              </p>
              <button
                onClick={handleReset}
                className="h-10 sm:h-12 rounded-xl bg-primary px-8 sm:px-10 text-xs sm:text-sm font-bold text-primary-foreground hover:opacity-90 transition-all shadow-sm uppercase tracking-widest"
              >
                Filtreleri Temizle
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
