"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setDraftFilters(filters);
    }
  };

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
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden flex items-center gap-2 rounded-xl h-10 border-border/40 font-bold"
        >
          <SlidersHorizontal className="size-4" />
          Filtreler
          {activeCount > 0 && (
            <span className="bg-primary text-primary-foreground rounded-lg px-1.5 py-0.5 text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </Button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader className="border-b border-border/50">
          <DrawerTitle className="text-sm font-black uppercase tracking-[0.2em] italic text-center">İlanları Filtrele</DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-1 py-2">
          <ListingsFilterPanel
            brands={brands}
            cities={cities}
            filters={draftFilters}
            isMobile
            onFilterChange={handleDraftFilterChange}
            onReset={handleReset}
          />
        </div>

        <DrawerFooter className="border-t border-border/50 bg-background/80 backdrop-blur-md pt-4">
          <div className="flex gap-3">
            <DrawerClose asChild>
              <Button variant="outline" onClick={handleReset} className="flex-1 h-12 rounded-xl font-bold">
                Temizle
              </Button>
            </DrawerClose>
            <Button onClick={handleApply} className="flex-1 h-12 rounded-xl font-bold">
              Sonuçları Gör ({draftActiveCount})
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
