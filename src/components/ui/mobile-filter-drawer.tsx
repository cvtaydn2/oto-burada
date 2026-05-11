"use client";

import { Loader2, SlidersHorizontal } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ListingsFilterPanel } from "@/features/marketplace/components/listings-filter-panel";
import { MarketplaceQuickFilters } from "@/features/marketplace/components/marketplace-quick-filters";
import { useFilterResultCount } from "@/features/marketplace/hooks/use-filter-result-count";
import { useAnalytics } from "@/hooks/use-analytics";
import { cn } from "@/lib/utils";
import type { BrandCatalogItem, CityOption, ListingFilters } from "@/types";

interface MobileFilterDrawerProps {
  brands: BrandCatalogItem[];
  cities: CityOption[];
  filters: ListingFilters;
  activeCount: number;
  resultCount?: number;
  onApply?: (filters: ListingFilters) => void;
  onReset?: () => void;
  onInstantApplyPatch?: (patch: Partial<ListingFilters>, options?: { scroll?: boolean }) => void;
}

export function MobileFilterDrawer({
  brands,
  cities,
  filters,
  activeCount,
  resultCount,
  onApply,
  onReset,
  onInstantApplyPatch,
}: MobileFilterDrawerProps) {
  const { trackFilter } = useAnalytics();
  const [isOpen, setIsOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<ListingFilters>(filters);

  const draftActiveCount = Object.entries(draftFilters).filter(([key, value]) => {
    if (["limit", "offset", "sort", "page"].includes(key)) {
      return false;
    }
    return value !== undefined && value !== "";
  }).length;

  const hasDraftChanges = useMemo(
    () => JSON.stringify(draftFilters) !== JSON.stringify(filters),
    [draftFilters, filters]
  );

  const { count: previewCount, isLoading: isPreviewLoading } = useFilterResultCount(
    draftFilters,
    resultCount ?? 0,
    {
      debounceMs: 350,
      enabled: isOpen,
    }
  );

  // Wrap onApply with analytics tracking
  const wrappedOnApply = useCallback(
    (appliedFilters: ListingFilters) => {
      // Build a concise filter summary for analytics
      const activeFilters = Object.entries(appliedFilters)
        .filter(([k, v]) => v !== undefined && v !== "" && !["limit", "offset", "page"].includes(k))
        .map(([k, v]) => `${k}=${v}`)
        .join(",");
      trackFilter("filters_applied", activeFilters || "none");
      onApply?.(appliedFilters);
    },
    [onApply, trackFilter]
  );

  // Wrap onReset with analytics tracking
  const wrappedOnReset = useCallback(() => {
    trackFilter("reset", "all");
    onReset?.();
  }, [onReset, trackFilter]);

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

  const handleInstantApplyPatch = (
    patch: Partial<ListingFilters>,
    options?: { scroll?: boolean }
  ) => {
    const nextDraftFilters: ListingFilters = {
      ...draftFilters,
      ...patch,
      page: 1,
    };

    setDraftFilters(nextDraftFilters);
    onInstantApplyPatch?.(patch, options);
  };

  const handleInstantReset = () => {
    const nextDraftFilters: ListingFilters = { page: 1, limit: 12, sort: "newest" };

    setDraftFilters(nextDraftFilters);
    onReset?.();
  };

  const handleApply = () => {
    wrappedOnApply(draftFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    wrappedOnReset();
    setIsOpen(false);
  };

  const resultLabel = previewCount.toLocaleString("tr-TR");
  const ctaLabel = isPreviewLoading
    ? "Sonuçlar güncelleniyor..."
    : previewCount === 0
      ? "Uygula · sonuç bulunamadı"
      : `Uygula · ${resultLabel} ilanı gör`;
  const helperCopy = isPreviewLoading
    ? "Taslak filtrelere göre sonuç önizlemesi hazırlanıyor."
    : previewCount === 0
      ? "Bu taslakla sonuç yok. Filtreleri daraltmak yerine gevşetmeyi deneyin."
      : hasDraftChanges
        ? `Uyguladığınızda ${resultLabel} ilan açılacak.`
        : `${resultLabel} ilan şu anki filtrelerle eşleşiyor.`;

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
          <DrawerDescription className="sr-only">
            İlanları marka, model, şehir ve diğer kriterlere göre filtreleyin.
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 py-3">
          <section className="mb-4 rounded-3xl border border-border/60 bg-card/60 p-4 shadow-sm shadow-slate-950/5">
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground">
                Hızlı Karar
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                Sık kullanılan kontroller sonuçları anında günceller. Detay filtreler aşağıda taslak
                olarak kalır.
              </p>
            </div>

            <MarketplaceQuickFilters
              filters={draftFilters}
              applyImmediateFilterPatch={handleInstantApplyPatch}
              handleReset={handleInstantReset}
              className="mt-3 flex-nowrap gap-2 overflow-x-auto pb-1 pr-1 sm:mt-3 sm:gap-2 [&::-webkit-scrollbar]:hidden"
            />
          </section>

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
          <div className="space-y-3">
            <div
              className={cn(
                "rounded-2xl border px-4 py-3 transition-colors",
                isPreviewLoading
                  ? "border-border/60 bg-muted/40"
                  : previewCount === 0
                    ? "border-amber-200 bg-amber-50/80"
                    : "border-emerald-200 bg-emerald-50/80"
              )}
            >
              <p className="text-sm font-bold text-foreground">
                {isPreviewLoading
                  ? "Canlı sonuç önizlemesi güncelleniyor"
                  : previewCount === 0
                    ? "Bu taslakla ilan bulunamadı"
                    : `${resultLabel} ilan önizlemede eşleşti`}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{helperCopy}</p>
            </div>

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
                <span className="flex items-center justify-center gap-2">
                  {isPreviewLoading && <Loader2 className="size-4 animate-spin" />}
                  <span>{ctaLabel}</span>
                </span>
              </Button>
            </div>

            {!isPreviewLoading && draftActiveCount > 0 && (
              <p className="text-center text-[11px] font-medium leading-4 text-muted-foreground">
                Filtreleri kaydetmek için uygula; kapatınca mevcut sonuçlar korunur.
              </p>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
