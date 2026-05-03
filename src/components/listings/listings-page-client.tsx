"use client";

import { BadgeCheck, RefreshCcw, RefreshCw, Search, Star, TrendingDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ListingPagination } from "@/components/listings/listing-pagination";
import { ListingsGridSkeleton } from "@/components/listings/listings-grid-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ListingCard } from "@/components/shared/listing-card";
import { ActiveFilterTags } from "@/features/marketplace/components/active-filter-tags";
import { MarketplaceControls } from "@/features/marketplace/components/marketplace-controls";
import { MarketplaceHeader } from "@/features/marketplace/components/marketplace-header";
import { MarketplaceSidebar } from "@/features/marketplace/components/marketplace-sidebar";
import { useMarketplaceLogic } from "@/features/marketplace/hooks/use-marketplace-logic";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
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
    metadata?: {
      droppedFilters?: string[];
      warning?: string;
    };
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
    currentPage,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    handleFilterChange,
    handleReset,
    applyFilters,
    refetch,
    isError,
    error,
    droppedFilters,
    droppedWarning,
  } = useMarketplaceLogic({ initialResult, initialFilters });

  const [showDroppedFilters, setShowDroppedFilters] = useState(true);

  const { refreshing, pullDistance, isActive } = usePullToRefresh({
    threshold: 80,
    onRefresh: async () => {
      await refetch();
    },
  });

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const lastFetchRef = useRef<number>(0);
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const now = Date.now();
          if (now - lastFetchRef.current > 2000) {
            lastFetchRef.current = now;
            fetchNextPage();
          }
        }
      },
      { rootMargin: "50px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const currentLimit = filters.limit ?? initialResult.limit;
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

      <div className="mx-auto min-h-screen max-w-7xl bg-background px-3 py-6 sm:px-4 sm:py-8">
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

          <div className="mt-4 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
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
                    else if (qf.type === "expert") {
                      handleFilterChange(
                        "hasExpertReport",
                        filters.hasExpertReport ? undefined : true
                      );
                    } else if (qf.type === "price_low") {
                      handleFilterChange(
                        "sort",
                        filters.sort === "price_asc" ? "newest" : "price_asc"
                      );
                    } else if (qf.type === "newest") {
                      handleFilterChange("sort", "newest");
                    }
                  }}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all active:scale-95 sm:px-5",
                    qf.type === "reset"
                      ? "border-border bg-card text-muted-foreground hover:border-foreground hover:text-foreground"
                      : isActive
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card text-muted-foreground hover:border-foreground hover:text-foreground"
                  )}
                >
                  {qf.icon && <qf.icon size={14} strokeWidth={2.5} />}
                  {qf.label}
                </button>
              );
            })}
          </div>

          {filters.validationError && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-4 text-sm font-medium text-amber-700 animate-in fade-in slide-in-from-top-2 duration-300">
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

          {droppedFilters && droppedFilters.length > 0 && showDroppedFilters && (
            <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-amber-100 bg-amber-50/60 p-3 text-sm text-amber-800">
              <div>
                <div className="font-semibold">Bazı filtreler uygulanmadı</div>
                <div className="mt-1 text-xs text-amber-700/90">
                  Desteklenmeyen filtre: {droppedFilters.join(", ")}
                </div>
                {droppedWarning && (
                  <div className="mt-1 text-xs text-amber-700/80">{droppedWarning}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleReset();
                    setShowDroppedFilters(false);
                  }}
                  className="h-8 rounded-md bg-amber-600 px-3 text-xs font-semibold text-white"
                >
                  Filtreleri Temizle
                </button>
                <button
                  onClick={() => setShowDroppedFilters(false)}
                  className="text-sm text-amber-700/80 underline"
                >
                  Kapat
                </button>
              </div>
            </div>
          )}
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

          <div className="min-w-0 flex-1">
            {isError ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-4 py-16 sm:py-24">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-50 sm:size-16">
                  <RefreshCcw size={28} className="text-red-500" />
                </div>
                <h3 className="mb-2 text-base font-bold tracking-tight text-foreground sm:text-lg">
                  İlanlar yüklenirken hata oluştu
                </h3>
                <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground sm:mb-8">
                  {error instanceof Error ? error.message : "Bağlantı sırasında bir sorun oluştu."}
                </p>
                <button
                  onClick={() => {
                    void refetch();
                  }}
                  className="flex h-10 items-center gap-2 rounded-xl bg-primary px-8 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 sm:h-12 sm:px-10"
                >
                  <RefreshCcw size={14} />
                  Tekrar Dene
                </button>
              </div>
            ) : isPending ? (
              <div className="min-h-[400px] rounded-2xl border border-border bg-card p-6 shadow-sm sm:min-h-[600px] sm:p-10">
                <ListingsGridSkeleton />
              </div>
            ) : allListings.length > 0 ? (
              <div className="space-y-6 sm:space-y-8">
                <div
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                  aria-live="polite"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Toplam{" "}
                      <span className="font-bold text-foreground">
                        {total.toLocaleString("tr-TR")}
                      </span>{" "}
                      ilan
                    </p>
                    <p className="text-xs text-muted-foreground/80">
                      {visibleStart > 0
                        ? `${visibleStart} - ${visibleEnd} arası sonuçlar gösteriliyor`
                        : "Sonuç bulunamadı"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <label
                      htmlFor="listing-page-size"
                      className="text-xs font-semibold tracking-wide text-muted-foreground"
                    >
                      Sayfada
                    </label>
                    <select
                      id="listing-page-size"
                      value={currentLimit}
                      onChange={(event) => handlePageSizeChange(Number(event.target.value))}
                      className="h-9 min-w-[90px] rounded-lg border border-border bg-card px-2 text-sm font-medium text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/30 sm:px-3"
                    >
                      {PAGE_SIZE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option} / sayfa
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div
                  className={cn(
                    "relative transition-opacity duration-normal",
                    isPending ? "pointer-events-none opacity-50" : "opacity-100",
                    viewMode === "grid"
                      ? "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
                      : "flex flex-col gap-4"
                  )}
                >
                  {isPending && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/20 backdrop-blur-[1px]">
                      <div className="h-full w-full animate-in fade-in duration-normal">
                        <ListingsGridSkeleton />
                      </div>
                    </div>
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
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    {isFetchingNextPage ? (
                      <div className="flex items-center gap-3 rounded-full bg-muted/50 px-4 py-2">
                        <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Yükleniyor...
                        </span>
                      </div>
                    ) : hasNextPage ? (
                      <button
                        onClick={() => fetchNextPage()}
                        className="h-11 rounded-full border-2 border-border bg-card px-8 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
                      >
                        Daha Fazla Göster
                      </button>
                    ) : allListings.length > 0 ? (
                      <p className="text-sm font-medium text-muted-foreground/70">
                        Tüm ilanları görüntülediniz
                      </p>
                    ) : null}
                  </div>
                )}
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
