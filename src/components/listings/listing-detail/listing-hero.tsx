import { TrendingUp, MapPin, Calendar, Hash } from "lucide-react";
import { ViewCounter } from "@/components/listings/view-counter";

import type { Listing } from "@/types";
import type { ListingCardInsight } from "@/services/listings/listing-card-insights";

interface ListingHeroProps {
  listing: Listing;
  insight: ListingCardInsight; 
}

export function ListingHero({ listing, insight }: ListingHeroProps) {
  return (
    <div className="bg-card rounded-2xl p-10 border border-border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-end gap-10 relative overflow-hidden group">
      <div className="space-y-6 relative z-10 w-full">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-bold uppercase tracking-widest leading-none">
              {listing.brand}
            </span>
            <span className="px-3 py-1 bg-muted text-muted-foreground rounded-lg text-[10px] font-bold uppercase tracking-widest leading-none">
              {listing.year} MODEL
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-[1.1] tracking-tighter">
            {listing.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-muted rounded-xl">
              <MapPin size={14} className="text-muted-foreground" />
            </div>
            <span className="leading-none">{listing.city}, {listing.district}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-muted rounded-xl">
              <Calendar size={14} className="text-muted-foreground" />
            </div>
            <span className="leading-none">{new Date(listing.createdAt).toLocaleDateString("tr-TR")} GÜNCELLENDİ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-muted rounded-xl">
              <Hash size={14} className="text-muted-foreground" />
            </div>
            <span className="leading-none">İLAN NO: {listing.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <ViewCounter listingId={listing.id} initialCount={listing.viewCount} />
        </div>
      </div>

      <div className="text-left md:text-right w-full md:w-auto relative z-10 flex flex-col items-start md:items-end gap-3 shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm animate-in zoom-in duration-700">
          <TrendingUp size={14} className="text-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
            {insight.badgeLabel} İLAN
          </span>
        </div>
        <div className="text-5xl md:text-6xl font-bold text-foreground tracking-tighter mb-1">
          {new Intl.NumberFormat("tr-TR").format(listing.price)}
          <span className="text-2xl ml-1 text-muted-foreground/40 font-medium tracking-normal">TL</span>
        </div>
        <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">RESMİ SATIŞ FİYATI</p>
      </div>
    </div>
  );
}
