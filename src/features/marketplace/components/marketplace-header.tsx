"use client";


import { type ListingFilters } from "@/types";

interface MarketplaceHeaderProps {
  filters: ListingFilters;
  total: number;
}

export function MarketplaceHeader({ filters, total }: MarketplaceHeaderProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
        {filters.brand
          ? `${filters.brand}${filters.model ? ` ${filters.model}` : ""} İlanları`
          : "Satılık Araçlar"}
      </h1>
      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-primary/40" />
        Şu an {total} aktif ilan listeleniyor
      </p>
    </div>
  );
}
