"use client";

import { ArrowDownUp } from "lucide-react";
import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";
import { marketplace } from "@/lib/ui-strings";
import { cn } from "@/lib/utils";
import { type BrandCatalogItem, type CityOption, type ListingFilters } from "@/types";

const MobileFilterDrawer = dynamic(() =>
  import("@/components/ui/mobile-filter-drawer").then((mod) => mod.MobileFilterDrawer)
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

import { SaveSearchButton } from "@/features/marketplace/components/save-search-button";

interface MarketplaceControlsProps {
  filters: ListingFilters;
  activeFiltersCount: number;
  brands: BrandCatalogItem[];
  cities: CityOption[];
  viewMode: "grid" | "list";
  setViewMode: (v: "grid" | "list") => void;
  isSortOpen: boolean;
  setIsSortOpen: (v: boolean) => void;
  applyImmediateFilterPatch: (
    patch: Partial<ListingFilters>,
    options?: { scroll?: boolean }
  ) => void;
  handleReset: () => void;
  applyFilters: (filters: ListingFilters, immediate?: boolean) => void;
  userId?: string | null;
  total: number;
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
  applyImmediateFilterPatch,
  handleReset,
  applyFilters,
  userId,
  total,
}: MarketplaceControlsProps) {
  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === (filters.sort ?? "newest"))?.label || "En Yeni";

  return (
    <div className="flex w-full flex-wrap items-center gap-2 rounded-[1rem] border border-border/70 bg-background/70 p-2 shadow-sm shadow-slate-950/5 sm:w-auto sm:gap-2.5 sm:rounded-[1.2rem]">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
        <div className="min-w-0 flex-1 sm:hidden">
          <MobileFilterDrawer
            brands={brands}
            cities={cities}
            filters={filters}
            activeCount={activeFiltersCount}
            resultCount={total}
            onApply={(f) => applyFilters(f, true)}
            onReset={handleReset}
          />
        </div>

        <div className="hidden sm:block">
          <MobileFilterDrawer
            brands={brands}
            cities={cities}
            filters={filters}
            activeCount={activeFiltersCount}
            resultCount={total}
            onApply={(f) => applyFilters(f, true)}
            onReset={handleReset}
          />
        </div>

        <div className="hidden sm:block">
          <SaveSearchButton
            filters={filters}
            resultCount={total}
            userId={userId}
            variant="compact"
          />
        </div>
      </div>

      <div className="hidden h-8 w-px bg-border sm:block" />

      <div className="hidden sm:flex items-center gap-1 rounded-xl border border-border/60 bg-muted/30 p-1">
        <Button
          onClick={() => setViewMode("grid")}
          className={cn(
            "min-h-10 rounded-lg border px-3.5 py-2 text-xs font-bold transition-all",
            viewMode === "grid"
              ? "border-border/70 bg-card text-foreground shadow-sm shadow-slate-950/5"
              : "border-transparent bg-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Kart
        </Button>
        <Button
          onClick={() => setViewMode("list")}
          className={cn(
            "min-h-10 rounded-lg border px-3.5 py-2 text-xs font-bold transition-all",
            viewMode === "list"
              ? "border-border/70 bg-card text-foreground shadow-sm shadow-slate-950/5"
              : "border-transparent bg-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Liste
        </Button>
      </div>

      <div className="relative ml-auto w-full sm:w-auto">
        <Button
          onClick={() => setIsSortOpen(!isSortOpen)}
          className="flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/80 px-4 text-xs font-bold text-foreground transition-all hover:border-primary/15 hover:bg-muted/50 sm:w-auto sm:justify-start sm:px-5"
          aria-haspopup="listbox"
          aria-expanded={isSortOpen}
        >
          <ArrowDownUp size={14} strokeWidth={3} />
          <span>{currentSortLabel}</span>
          <ChevronIcon
            className={cn("ml-1 size-4 transition-transform", isSortOpen && "rotate-180")}
          />
        </Button>

        {isSortOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
            <ul className="absolute right-0 top-full z-50 mt-3 w-full min-w-[15rem] rounded-2xl border border-border/70 bg-card/95 p-2 shadow-[0_20px_48px_-28px_rgba(15,23,42,0.3)] animate-in fade-in zoom-in-95 duration-200 sm:w-64">
              {SORT_OPTIONS.map((option) => (
                <li key={option.value}>
                  <Button
                    onClick={() => {
                      applyImmediateFilterPatch(
                        { sort: option.value as ListingFilters["sort"] },
                        { scroll: false }
                      );
                      setIsSortOpen(false);
                    }}
                    className={cn(
                      "w-full rounded-xl px-4 py-3 text-left text-sm font-semibold shadow-none transition-all",
                      (filters.sort ?? "newest") === option.value
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    )}
                  >
                    {option.label}
                  </Button>
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
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
