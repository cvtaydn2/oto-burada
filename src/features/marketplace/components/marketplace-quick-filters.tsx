"use client";

import { BadgeCheck, Star, TrendingDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { marketplace } from "@/lib/ui-strings";
import { cn } from "@/lib/utils";
import { type ListingFilters } from "@/types";

const QUICK_FILTERS = [
  { label: marketplace.quickFilters.all, type: "reset" as const, icon: null },
  { label: marketplace.quickFilters.expert, type: "expert" as const, icon: BadgeCheck },
  { label: marketplace.quickFilters.priceDrop, type: "price_low" as const, icon: TrendingDown },
  { label: marketplace.quickFilters.newest, type: "newest" as const, icon: Star },
];

interface MarketplaceQuickFiltersProps {
  filters: ListingFilters;
  applyImmediateFilterPatch: (
    patch: Partial<ListingFilters>,
    options?: { scroll?: boolean }
  ) => void;
  handleReset: () => void;
  className?: string;
}

export function MarketplaceQuickFilters({
  filters,
  applyImmediateFilterPatch,
  handleReset,
  className,
}: MarketplaceQuickFiltersProps) {
  return (
    <div className={cn("mt-4 flex flex-wrap gap-2 sm:mt-6 sm:gap-3", className)}>
      {QUICK_FILTERS.map((qf) => {
        const isActive =
          (qf.type === "expert" && filters.hasExpertReport === true) ||
          (qf.type === "price_low" && filters.sort === "price_asc") ||
          (qf.type === "newest" && (filters.sort === "newest" || !filters.sort));

        return (
          <Button
            key={qf.label}
            aria-pressed={qf.type === "reset" ? undefined : isActive}
            onClick={() => {
              if (qf.type === "reset") {
                handleReset();
              } else if (qf.type === "expert") {
                applyImmediateFilterPatch({
                  hasExpertReport: filters.hasExpertReport ? undefined : true,
                });
              } else if (qf.type === "price_low") {
                applyImmediateFilterPatch({
                  sort: filters.sort === "price_asc" ? "newest" : "price_asc",
                });
              } else if (qf.type === "newest") {
                applyImmediateFilterPatch({ sort: "newest" });
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
          </Button>
        );
      })}
    </div>
  );
}
