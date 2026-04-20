"use client";

import dynamic from "next/dynamic";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ListingFilters, type BrandCatalogItem, type CityOption } from "@/types";

const SmartFilters = dynamic(
  () => import("@/components/modules/listings/smart-filters").then((mod) => mod.SmartFilters),
  {
    loading: () => <div className="min-h-[320px] rounded-xl border border-border bg-card shadow-sm" />,
  },
);

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
  activeFiltersCount,
  handleFilterChange,
  handleReset
}: MarketplaceSidebarProps) {
  const filteredModels = (brands.find(b => b.brand === filters.brand)?.models || []).map(m => m.name);
  const filteredTrims = (brands.find(b => b.brand === filters.brand)?.models?.find(m => m.name === filters.model)?.trims || []);
  const filteredDistricts = (cities.find(c => c.city === filters.city)?.districts || []);

  return (
    <aside className="hidden lg:block w-[320px] shrink-0">
      <div className={cn(
        "sticky top-28 rounded-2xl border border-border bg-card overflow-hidden shadow-sm transition-all",
        isPending && "opacity-50 pointer-events-none grayscale"
      )}>
        <div className="bg-muted/50 p-6 border-b border-border">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-primary" />
            Filtreleme
          </h3>
        </div>
        <div className="p-2">
          <SmartFilters
            brands={brands}
            cities={cities}
            filters={filters}
            models={filteredModels}
            trims={filteredTrims}
            districts={filteredDistricts}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
            activeCount={activeFiltersCount}
          />
        </div>
      </div>
    </aside>
  );
}
