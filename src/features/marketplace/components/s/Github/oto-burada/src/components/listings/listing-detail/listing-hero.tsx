import { Calendar, Hash, MapPin, TrendingUp } from "lucide-react";

import { ViewCounter } from "@/features/marketplace/components/view-counter";
import type { ListingCardInsight } from "@/features/marketplace/services/listing-card-insights";
import type { Listing } from "@/types";

interface ListingHeroProps {
  listing: Listing;
  insight: ListingCardInsight;
}

export function ListingHero({ listing, insight }: ListingHeroProps) {
  return (
    <div className="bg-card rounded-2xl p-4 sm:p-6 md:p-10 border border-border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-end gap-4 sm:gap-6 md:gap-10 relative overflow-hidden group">
      <div className="space-y-3 sm:space-y-4 md:space-y-6 relative z-10 w-full">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="px-2.5 sm:px-3 py-1 bg-primary/10 text-primary rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-widest leading-none">
              {listing.brand}
            </span>
            <span className="px-2.5 sm:px-3 py-1 bg-muted text-muted-foreground rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-widest leading-none">
              {listing.year} MODEL
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-[1.15] tracking-tighter">
            {listing.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 bg-muted rounded-lg sm:rounded-xl">
              <MapPin size={12} className="sm:size-14 text-muted-foreground" />
            </div>
            <span className="leading-none">
              {listing.city}, {listing.district}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 bg-muted rounded-lg sm:rounded-xl">
              <Calendar size={12} className="sm:size-14 text-muted-foreground" />
            </div>
            <span className="leading-none">
              {new Date(listing.createdAt).toLocaleDateString("tr-TR")}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="p-2 bg-muted rounded-xl">
              <Hash size={14} className="text-muted-foreground" />
            </div>
            <span className="leading-none">İLAN NO: {listing.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <ViewCounter listingId={listing.id} initialCount={listing.viewCount} />
        </div>
      </div>

      <div className="text-left md:text-right w-full md:w-auto relative z-10 flex flex-col items-start md:items-end gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm animate-in zoom-in duration-700">
          <TrendingUp size={14} className="text-emerald-500" />
          <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
            {insight.badgeLabel} İLAN
          </span>
        </div>
        <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tighter">
          {new Intl.NumberFormat("tr-TR").format(listing.price)}
          <span className="text-lg sm:text-xl md:text-2xl ml-1 text-muted-foreground/40 font-medium tracking-normal">
            TL
          </span>
        </div>
        <p className="text-[9px] sm:text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">
          RESMİ SATIŞ FİYATI
        </p>
      </div>
    </div>
  );
}
