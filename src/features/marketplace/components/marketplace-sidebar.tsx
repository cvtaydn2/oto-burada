"use client";

import { ListingsFilterPanel } from "@/components/listings/listings-filter-panel";
import { cn } from "@/lib/utils";
import { type BrandCatalogItem, type CityOption, type ListingFilters } from "@/types";

interface MarketplaceSidebarProps {
  brands: BrandCatalogItem[];
  cities: CityOption[];
  filters: ListingFilters;
  isPending: boolean;
  activeFiltersCount: number;
  handleFilterChange: <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => void;
  handleReset: () => void;
}

export function MarketplaceSidebar({
  brands,
  cities,
  filters,
  isPending,
  handleFilterChange,
  handleReset,
}: MarketplaceSidebarProps) {
  return (
    <aside className="hidden lg:block w-72 xl:w-80 shrink-0">
      <div
        className={cn(
          "sticky top-28 transition-all",
          isPending && "opacity-50 pointer-events-none grayscale"
        )}
      >
        <ListingsFilterPanel
          brands={brands}
          cities={cities}
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
        />
      </div>
    </aside>
  );
}
