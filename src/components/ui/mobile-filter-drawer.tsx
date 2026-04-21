"use client";

import { useEffect, useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingsFilterPanel } from "@/components/listings/listings-filter-panel";
import type { ListingFilters, BrandCatalogItem, CityOption } from "@/types";

interface MobileFilterDrawerProps {
  brands: BrandCatalogItem[];
  cities: CityOption[];
  filters: ListingFilters;
  activeCount: number;
  onApply?: (filters: ListingFilters) => void;
  onReset?: () => void;
}

export function MobileFilterDrawer({
  brands,
  cities,
  filters,
  activeCount,
  onApply,
  onReset,
}: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<ListingFilters>(filters);
  const draftActiveCount = Object.entries(draftFilters).filter(([key, value]) => {
    if (["limit", "offset", "sort", "page"].includes(key)) {
      return false;
    }

    return value !== undefined && value !== "";
  }).length;

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);
  useEffect(() => {
    if (isOpen) {
      setDraftFilters(filters);
    }
  }, [filters, isOpen]);

  const handleDraftFilterChange = <K extends keyof ListingFilters>(
    key: K,
    value: ListingFilters[K],
  ) => {
    setDraftFilters((current) => ({
      ...current,
      [key]: value,
      page: 1,
      ...(key === "brand" ? { model: undefined, carTrim: undefined } : {}),
      ...(key === "model" ? { carTrim: undefined } : {}),
      ...(key === "city" ? { district: undefined } : {}),
    }));
  };

  const handleApply = () => {
    onApply?.(draftFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    onReset?.();
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="lg:hidden flex items-center gap-2"
        onClick={() => setIsOpen(true)}
      >
        <SlidersHorizontal className="size-4" />
        Filtreler
        {activeCount > 0 && (
          <span className="bg-primary text-primary-foreground rounded-lg px-1.5 py-0.5 text-xs font-medium">
            {activeCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)} 
          />
          
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-hidden rounded-t-2xl bg-background animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="font-semibold">Filtreler</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="overflow-y-auto pb-24" style={{ maxHeight: "calc(85vh - 120px)" }}>
              <ListingsFilterPanel
                brands={brands}
                cities={cities}
                filters={draftFilters}
                isMobile
                onFilterChange={handleDraftFilterChange}
                onReset={handleReset}
              />
            </div>

            <div className="absolute bottom-0 left-0 right-0 flex gap-2 border-t bg-background p-4">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Temizle
              </Button>
              <Button onClick={handleApply} className="flex-1">
                Uygula ({draftActiveCount})
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
