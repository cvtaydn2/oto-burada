import Image from "next/image";
import { Heart, MapPin } from "lucide-react";

import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Listing } from "@/types";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const coverImage = listing.images.find((image) => image.isCover) ?? listing.images[0];

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-background shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={coverImage.url}
          alt={listing.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <span className="rounded-full bg-background/95 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
            {listing.featured ? "Öne Çıkan" : "Yeni İlan"}
          </span>
          <button
            type="button"
            aria-label="Favorilere ekle"
            className="flex size-9 items-center justify-center rounded-full bg-background/95 text-foreground shadow-sm transition-colors hover:bg-background"
          >
            <Heart className="size-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="space-y-2">
          <p className="text-2xl font-semibold tracking-tight text-primary">
            {formatCurrency(listing.price)}
          </p>
          <h3 className="line-clamp-2 text-lg font-semibold tracking-tight">{listing.title}</h3>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
          <span className="rounded-full bg-muted px-3 py-1.5">{listing.year}</span>
          <span className="rounded-full bg-muted px-3 py-1.5">
            {formatNumber(listing.mileage)} km
          </span>
          <span className="rounded-full bg-muted px-3 py-1.5">{listing.fuelType}</span>
          <span className="rounded-full bg-muted px-3 py-1.5">{listing.transmission}</span>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="size-4" />
            <span>
              {listing.city} / {listing.district}
            </span>
          </div>
          <span>{listing.images.length} fotoğraf</span>
        </div>
      </div>
    </article>
  );
}
