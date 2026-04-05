import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";

import { FavoriteButton } from "@/components/listings/favorite-button";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Listing } from "@/types";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const coverImage = listing.images.find((image) => image.isCover) ?? listing.images[0];
  const detailHref = `/listing/${listing.slug}`;

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-background shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
      <div className="relative">
        <Link href={detailHref} className="block">
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            <Image
              src={coverImage.url}
              alt={listing.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-x-0 top-0 flex items-center justify-start p-3">
              <span className="rounded-full bg-background/95 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                {listing.featured ? "Öne Çıkan" : "Yeni İlan"}
              </span>
            </div>
          </div>
        </Link>

        <FavoriteButton
          listingId={listing.id}
          className="absolute right-3 top-3 size-11"
        />
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="space-y-2">
          <p className="text-2xl font-semibold tracking-tight text-primary">
            {formatCurrency(listing.price)}
          </p>
          <Link href={detailHref} className="block">
            <h3 className="line-clamp-2 text-lg font-semibold tracking-tight transition-colors hover:text-primary">
              {listing.title}
            </h3>
          </Link>
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

        <Link
          href={detailHref}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          İlanı İncele
        </Link>
      </div>
    </article>
  );
}
