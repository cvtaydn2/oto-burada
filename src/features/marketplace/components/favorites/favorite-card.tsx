import {
  CarFront,
  ExternalLink,
  Fuel,
  Gauge,
  MapPin,
  Settings2,
  ShieldCheck,
  Trash2,
  TrendingDown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ListingPromoBadges } from "@/features/marketplace/components/listing-promo-badges";
import { getListingDopingDisplayItems } from "@/features/marketplace/lib/utils";
import { Button } from "@/features/ui/components/button";
import { formatNumber, formatPrice, supabaseImageUrl } from "@/lib";
import type { Listing } from "@/types";

interface FavoriteCardProps {
  listing: Listing;
  priority: boolean;
  onRemove: () => void;
}

export function FavoriteCard({ listing, priority, onRemove }: FavoriteCardProps) {
  const images = listing.images ?? [];
  const coverImage = images.find((img) => img.isCover) ?? images[0];
  const isAdvantageous = (listing.marketPriceIndex ?? 1) < 0.95;
  const hasExpert = listing.expertInspection?.hasInspection;
  const dopingItems = getListingDopingDisplayItems(listing);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md hover:border-border/70">
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {coverImage ? (
          <Image
            src={supabaseImageUrl(coverImage.url, 480, 80)}
            alt={listing.title}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500"
            priority={priority}
            placeholder={coverImage.placeholderBlur ? "blur" : "empty"}
            blurDataURL={coverImage.placeholderBlur ?? undefined}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/50">
            <CarFront size={40} className="stroke-[1]" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {isAdvantageous && (
            <span className="flex items-center gap-1 rounded-full bg-orange-500/90 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
              <TrendingDown size={10} /> AVANTAJLI
            </span>
          )}
          {hasExpert && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
              <ShieldCheck size={10} /> EKSPERTİZLİ
            </span>
          )}
          <ListingPromoBadges items={dopingItems} limit={1} size="sm" variant="glass" />
        </div>

        {/* Remove button */}
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onRemove();
          }}
          aria-label="Favorilerden kaldır"
          className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full bg-card/90 text-muted-foreground shadow-sm backdrop-blur transition hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 size={14} />
        </Button>

        {/* Photo count */}
        <div className="absolute bottom-3 right-3 rounded-lg bg-black/50 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
          {images.length} FOTO
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title + price */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
              {listing.brand} {listing.model}
            </p>
            <h3 className="mt-0.5 truncate text-sm font-bold text-foreground leading-tight">
              {listing.title}
            </h3>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-bold text-primary leading-tight">
              {formatPrice(listing.price)}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground/70">TL</p>
          </div>
        </div>

        {/* Specs */}
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-muted/30 p-2.5">
          <SpecItem icon={<Gauge size={12} />} value={`${formatNumber(listing.mileage)} km`} />
          <SpecItem
            icon={<Settings2 size={12} />}
            value={listing.transmission === "yari_otomatik" ? "Yarı Oto." : listing.transmission}
          />
          <SpecItem icon={<Fuel size={12} />} value={listing.fuelType} />
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <MapPin size={11} className="text-muted-foreground/70" />
            {listing.city} · {listing.year}
          </span>
          <Link
            href={`/listing/${listing.slug}`}
            className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-600 transition hover:bg-blue-100"
          >
            İncele
            <ExternalLink size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function SpecItem({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-muted-foreground/70">{icon}</span>
      <span className="text-center text-[10px] font-bold text-muted-foreground capitalize leading-tight">
        {value}
      </span>
    </div>
  );
}
