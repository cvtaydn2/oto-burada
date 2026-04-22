"use client";

import { cn } from "@/lib/utils";
import { type ListingFilters, type BrandCatalogItem, type CityOption } from "@/types";
import { ListingsFilterPanel } from "@/components/listings/listings-filter-panel";

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
  handleReset
}: MarketplaceSidebarProps) {
  return (
    <aside className="hidden lg:block w-[280px] xl:w-[320px] shrink-0">
      <div className={cn(
        "sticky top-28 transition-all",
        isPending && "opacity-50 pointer-events-none grayscale"
      )}>
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
