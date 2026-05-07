"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { ListingsFilterPanel } from "@/features/marketplace/components/listings-filter-panel";
import { Button } from "@/features/ui/components/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/features/ui/components/drawer";
import type { BrandCatalogItem, CityOption, ListingFilters } from "@/types";

interface MobileFilterDrawerProps {
  brands: BrandCatalogItem[];
  cities: CityOption[];
  filters: ListingFilters;
  activeCount: number;
  resultCount?: number;
  onApply?: (filters: ListingFilters) => void;
  onReset?: () => void;
}

export function MobileFilterDrawer({
  brands,
  cities,
  filters,
  activeCount,
  resultCount,
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
    value: ListingFilters[K]
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

  const applyLabel =
    typeof resultCount === "number"
      ? `${resultCount.toLocaleString("tr-TR")} ilanı göster`
      : `${draftActiveCount} filtre uygula`;

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex h-11 items-center gap-2 rounded-xl border-border/40 font-bold lg:hidden"
        >
          <SlidersHorizontal className="size-4" />
          Filtreler
          {activeCount > 0 && (
            <span className="rounded-lg bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader className="border-b border-border/50">
          <DrawerTitle className="text-center text-sm font-black uppercase tracking-[0.2em]">
            İlanları Filtrele
          </DrawerTitle>
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

        <DrawerFooter className="border-t border-border/50 bg-background/80 pt-4 backdrop-blur-md">
          <div className="flex gap-3">
            <DrawerClose asChild>
              <Button
                variant="outline"
                onClick={handleReset}
                className="h-12 flex-1 rounded-xl font-bold"
              >
                Temizle
              </Button>
            </DrawerClose>
            <Button onClick={handleApply} className="h-12 flex-1 rounded-xl font-bold">
              {applyLabel}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
