import { MapPin, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getListingDopingDisplayItems } from "@/features/marketplace/lib/utils";
import {} from "@/lib";
import { formatPrice } from "@/lib/utils/format";
import { type Listing } from "@/types";

interface ListingHeaderProps {
  listing: Listing;
}

export function ListingHeader({ listing }: ListingHeaderProps) {
  const isAdvantageous = (listing.marketPriceIndex ?? 1) < 0.95;
  const activeDopings = getListingDopingDisplayItems(listing);

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-start gap-2">
            <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              {listing.brand}{" "}
              <span className="font-medium text-muted-foreground">{listing.model}</span>
            </h1>
            {activeDopings.slice(0, 3).map((doping) => (
              <Badge
                key={doping.type}
                className="min-h-7 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white"
              >
                <Sparkles className="mr-1 size-3" />
                {doping.label}
              </Badge>
            ))}
            {isAdvantageous && (
              <Badge className="min-h-7 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                Avantajlı Fiyat
              </Badge>
            )}
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            {listing.title}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/5 px-3 py-1 text-primary/90">
              <MapPin className="size-4 text-primary" />
              {listing.city} / {listing.district}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 lg:min-w-[180px] lg:text-right">
          <div className="text-2xl font-bold text-primary sm:text-3xl">
            {formatPrice(listing.price)}
            <span className="ml-1 text-base font-semibold text-muted-foreground/70 sm:text-lg">
              TL
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
