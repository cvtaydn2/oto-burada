"use client";


import { LayoutGrid, List, ArrowDownUp, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { type ListingFilters, type BrandCatalogItem, type CityOption } from "@/types";
import { createSearchParamsFromListingFilters } from "@/services/listings/listing-filters";
import { marketplace } from "@/lib/constants/ui-strings";

const MobileFilterDrawer = dynamic(
  () => import("@/components/ui/mobile-filter-drawer").then((mod) => mod.MobileFilterDrawer),
);

const SORT_OPTIONS = [
  { value: "newest", label: marketplace.sortOptions.newest },
  { value: "oldest", label: marketplace.sortOptions.oldest },
  { value: "price_asc", label: marketplace.sortOptions.priceAsc },
  { value: "price_desc", label: marketplace.sortOptions.priceDesc },
  { value: "mileage_asc", label: marketplace.sortOptions.mileageAsc },
  { value: "mileage_desc", label: marketplace.sortOptions.mileageDesc },
  { value: "year_desc", label: marketplace.sortOptions.yearDesc },
  { value: "year_asc", label: marketplace.sortOptions.yearAsc },
];

interface MarketplaceControlsProps {
  filters: ListingFilters;
  activeFiltersCount: number;
  brands: BrandCatalogItem[];
  cities: CityOption[];
  viewMode: "grid" | "list";
  setViewMode: (v: "grid" | "list") => void;
  isSortOpen: boolean;
  setIsSortOpen: (v: boolean) => void;
  handleFilterChange: <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => void;
}

export function MarketplaceControls({
  filters,
  activeFiltersCount,
  brands,
  cities,
  viewMode,
  setViewMode,
  isSortOpen,
  setIsSortOpen,
  handleFilterChange
}: MarketplaceControlsProps) {
  const currentSortLabel = SORT_OPTIONS.find(o => o.value === (filters.sort ?? "newest"))?.label || "En Yeni";

  return (
    <div className="flex flex-wrap items-center gap-2 bg-card border border-border p-1.5 rounded-xl shadow-sm">
      <MobileFilterDrawer
        brands={brands}
        cities={cities}
        filters={filters}
        activeCount={activeFiltersCount}
      />

      <Link
        href={`/listings/filter?${createSearchParamsFromListingFilters(filters).toString()}`}
        className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground hover:opacity-90 transition-all active:scale-95 uppercase tracking-widest"
      >
        <SlidersHorizontal size={14} strokeWidth={3} />
        Gelişmiş Filtrele
      </Link>

      <div className="h-8 w-px bg-border mx-1 hidden sm:block" />

      <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-muted/30">
        <button
          onClick={() => setViewMode("grid")}
          className={cn(
            "flex h-9 w-10 items-center justify-center rounded-lg transition-all",
            viewMode === "grid"
              ? "bg-card text-foreground shadow-sm border border-border/50"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutGrid size={18} />
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={cn(
            "flex h-9 w-10 items-center justify-center rounded-lg transition-all",
            viewMode === "list"
              ? "bg-card text-foreground shadow-sm border border-border/50"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <List size={18} />
        </button>
      </div>

      <div className="relative">
        <button
          onClick={() => setIsSortOpen(!isSortOpen)}
          className="flex h-11 items-center gap-3 rounded-xl border border-border bg-card px-5 text-xs font-bold text-foreground hover:bg-muted/50 transition-all uppercase tracking-widest"
        >
          <ArrowDownUp size={14} strokeWidth={3} />
          <span className="hidden sm:inline">{currentSortLabel}</span>
          <ChevronIcon className={cn("transition-transform size-4 ml-1", isSortOpen && "rotate-180")} />
        </button>

        {isSortOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
            <ul className="absolute right-0 top-full z-50 mt-3 w-64 rounded-2xl border border-border bg-card p-2 shadow-sm animate-in fade-in zoom-in-95 duration-200">
              {SORT_OPTIONS.map((option) => (
                <li key={option.value}>
                  <button
                    onClick={() => {
                      handleFilterChange("sort", option.value as ListingFilters["sort"]);
                      setIsSortOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-left text-xs font-bold rounded-xl transition-all uppercase tracking-widest",
                      (filters.sort ?? "newest") === option.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
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
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
