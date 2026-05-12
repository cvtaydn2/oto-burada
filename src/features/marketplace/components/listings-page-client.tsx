"use client";

import { RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { ListingCard } from "@/components/shared/listing-card";
import { Button } from "@/components/ui/button";
import { ActiveFilterTags } from "@/features/marketplace/components/active-filter-tags";
import { DroppedFiltersAlert } from "@/features/marketplace/components/dropped-filters-alert";
import { ListingPagination } from "@/features/marketplace/components/listing-pagination";
import { ListingsErrorState } from "@/features/marketplace/components/listings-error-state";
import { ListingsGridSkeleton } from "@/features/marketplace/components/listings-grid-skeleton";
import { ListingsResultsSummary } from "@/features/marketplace/components/listings-results-summary";
import { MarketplaceControls } from "@/features/marketplace/components/marketplace-controls";
import { MarketplaceHeader } from "@/features/marketplace/components/marketplace-header";
import { MarketplaceQuickFilters } from "@/features/marketplace/components/marketplace-quick-filters";
import { MarketplaceSidebar } from "@/features/marketplace/components/marketplace-sidebar";
import { useMarketplaceLogic } from "@/features/marketplace/hooks/use-marketplace-logic";
import { type MarketplaceListingsQuery } from "@/features/marketplace/services/marketplace-query";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { cn } from "@/lib/utils";
import { type BrandCatalogItem, type CityOption, type Listing, type ListingFilters } from "@/types";

interface ListingsPageClientProps {
  initialResult: {
    listings: Listing[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    metadata?: {
      droppedFilters?: string[];
      warning?: string;
    };
  };
  brands: BrandCatalogItem[];
  cities: CityOption[];
  initialFilters: ListingFilters;
  initialQuery: MarketplaceListingsQuery;
  userId?: string;
}

export function ListingsPageClient({
  initialResult,
  brands,
  cities,
  initialFilters,
  initialQuery,
  userId,
}: ListingsPageClientProps) {
  const {
    filters,
    isPending,
    viewMode,
    setViewMode,
    isSortOpen,
    setIsSortOpen,
    activeFiltersCount,
    allListings,
    total,
    currentPage,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    handleFilterChange,
    applyInstantFilterChange,
    applyImmediateFilterPatch,
    handleReset,
    applyFilters,
    refetch,
    isError,
    error,
    droppedFilters,
    droppedWarning,
  } = useMarketplaceLogic({ initialResult, initialFilters, initialQuery });

  const { refreshing, pullDistance, isActive } = usePullToRefresh({
    threshold: 80,
    onRefresh: async () => {
      await refetch();
    },
  });

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const lastFetchRef = useRef<number>(0);

  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        const now = Date.now();
        if (now - lastFetchRef.current > 2000) {
          lastFetchRef.current = now;
          fetchNextPage();
        }
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(observerCallback, { rootMargin: "100px" });
    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [observerCallback]);

  const currentLimit = filters.limit ?? initialQuery.limit;
  const visibleStart = total === 0 ? 0 : (currentPage - 1) * currentLimit + 1;
  const visibleEnd = Math.min(currentPage * currentLimit, total);
  const showPagination = !hasNextPage && totalPages > 1;

  return (
    <>
      {isActive && (
        <div
          className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center bg-background/95 py-4 backdrop-blur-sm transition-transform"
          style={{
            transform: `translateY(${Math.min(pullDistance, 80)}px)`,
          }}
        >
          <RefreshCw
            className={cn(
              "size-6 text-primary transition-transform duration-300",
              refreshing && "animate-spin",
              pullDistance >= 80 && "rotate-180"
            )}
            aria-hidden="true"
          />
          <span className="sr-only">{refreshing ? "Yenileniyor..." : "Yenilemek için çekin"}</span>
        </div>
      )}

      <div className="mx-auto min-h-screen max-w-7xl bg-background px-3 py-4 sm:px-4 sm:py-6">
        <div className="mb-5 space-y-3 sm:mb-6 sm:space-y-4">
          <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
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
                applyImmediateFilterPatch={applyImmediateFilterPatch}
                handleReset={handleReset}
                applyFilters={applyFilters}
                userId={userId}
                total={total}
              />
            </div>

            <MarketplaceQuickFilters
              filters={filters}
              applyImmediateFilterPatch={applyImmediateFilterPatch}
              handleReset={handleReset}
            />
          </div>

          {filters.validationError && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-sm font-medium text-amber-700 animate-in fade-in slide-in-from-top-2 duration-300 sm:p-4">
              <Search size={14} className="mt-0.5 shrink-0" />
              <span className="leading-6">{filters.validationError}</span>
            </div>
          )}

          <ActiveFilterTags
            filters={filters}
            applyInstantFilterChange={applyInstantFilterChange}
            handleReset={handleReset}
            applyImmediateFilterPatch={applyImmediateFilterPatch}
          />

          <DroppedFiltersAlert
            droppedFilters={droppedFilters}
            droppedWarning={droppedWarning}
            handleReset={handleReset}
          />
        </div>

        <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
          <MarketplaceSidebar
            brands={brands}
            cities={cities}
            filters={filters}
            isPending={isPending}
            activeFiltersCount={activeFiltersCount}
            handleFilterChange={handleFilterChange}
            handleReset={handleReset}
          />

          <div className="min-w-0 flex-1">
            {isError ? (
              <ListingsErrorState error={error} refetch={refetch} />
            ) : allListings.length > 0 ? (
              <div className="space-y-4 sm:space-y-6">
                <ListingsResultsSummary
                  total={total}
                  visibleStart={visibleStart}
                  visibleEnd={visibleEnd}
                  currentLimit={currentLimit}
                  activeFiltersCount={activeFiltersCount}
                  handlePageSizeChange={handlePageSizeChange}
                />

                <div
                  className={cn(
                    "relative transition-opacity duration-normal",
                    isPending ? "pointer-events-none opacity-50" : "opacity-100",
                    viewMode === "grid"
                      ? "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5"
                      : "flex flex-col gap-4"
                  )}
                >
                  {isPending && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/20 backdrop-blur-[1px] rounded-2xl" />
                  )}

                  {allListings.map((listing, index) => (
                    <ListingCard
                      key={`${listing.id}-${index}`}
                      listing={listing}
                      priority={currentPage === 1 && (viewMode === "grid" ? index < 4 : index < 2)}
                      variant={viewMode}
                    />
                  ))}
                </div>

                {showPagination ? (
                  <ListingPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalListings={total}
                    pageSize={currentLimit}
                    onPageChange={handlePageChange}
                  />
                ) : (
                  <div ref={loadMoreRef} className="flex justify-center py-6 sm:py-8">
                    {isFetchingNextPage ? (
                      <div className="flex items-center gap-3 rounded-full bg-muted/50 px-4 py-2">
                        <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Yükleniyor...
                        </span>
                      </div>
                    ) : hasNextPage ? (
                      <Button
                        onClick={() => fetchNextPage()}
                        className="h-11 rounded-full border-2 border-border bg-card px-8 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
                      >
                        Daha Fazla Göster
                      </Button>
                    ) : allListings.length > 0 ? (
                      <p className="text-sm font-medium text-muted-foreground/70">
                        Tüm ilanları görüntülediniz
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            ) : isPending ? (
              <div className="min-h-[360px] rounded-2xl border border-border bg-card p-4 shadow-sm sm:min-h-[520px] sm:p-8">
                <ListingsGridSkeleton />
              </div>
            ) : (
              <EmptyState
                title="Sonuç Bulunamadı"
                description="Arama kriterlerinizi değiştirerek tekrar deneyin veya popüler aramalara göz atın."
                icon={<Search size={40} />}
                primaryAction={{
                  label: "Filtreleri Temizle",
                  onClick: () => {
                    handleReset();
                  },
                }}
                secondaryAction={{
                  label: "Tüm İlanlar",
                  onClick: () => {
                    handlePageChange(1);
                  },
                  href: "/listings",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
