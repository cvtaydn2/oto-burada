import { Calendar, Eye, Hash, MapPin, ShieldCheck, TrendingDown } from "lucide-react";

import type { Listing } from "@/types/listing";

import { FavoriteButton } from "../favorite-button";
import { ListingPromoBadgeItem, ListingPromoBadges } from "../listing-promo-badges";
import { ShareButton } from "../share-button";

interface ListingInfoCardProps {
  listing: Listing;
  marketValuationStatus?: string | null;
  dopingItems: ListingPromoBadgeItem[];
}

export function ListingInfoCard({
  listing,
  marketValuationStatus,
  dopingItems,
}: ListingInfoCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5 lg:p-6">
      {/* Badges row */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
        <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
          {listing.brand}
        </span>
        <span className="rounded-lg bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {listing.year} Model
        </span>
        <ListingPromoBadges items={dopingItems} limit={2} size="sm" variant="soft" />
        {listing.expertInspection?.hasInspection && (
          <span className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
            <ShieldCheck size={10} />
            Ekspertizli
          </span>
        )}
        {marketValuationStatus === "good" && (
          <span className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
            <TrendingDown size={10} />
            Avantajlı Fiyat
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="mb-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
        {listing.model}
      </h1>
      <p className="mb-3 text-sm leading-6 text-muted-foreground sm:mb-4">{listing.title}</p>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs leading-5 text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin size={13} className="text-primary" />
          {listing.city}, {listing.district}
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar size={13} />
          {new Date(listing.createdAt).toLocaleDateString("tr-TR")}
        </span>
        <span className="flex items-center gap-1.5">
          <Eye size={13} />
          {(listing.viewCount || 0).toLocaleString("tr-TR")} görüntülenme
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground/60">
          <Hash size={13} />
          {listing.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      {/* Action row */}
      <div className="mt-4 flex items-center gap-2 border-t border-border/50 pt-4">
        <ShareButton
          title={listing.title}
          price={listing.price}
          className="flex h-11 items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 text-xs font-bold text-muted-foreground transition hover:bg-muted"
        />
        <FavoriteButton
          listingId={listing.id}
          className="size-9 rounded-lg border border-border bg-muted/30 text-muted-foreground hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition"
        />
      </div>
    </div>
  );
}
