import Image from "next/image";
import Link from "next/link";
import { Calendar, Camera, Fuel, Gauge, MapPin, Settings2, Sparkles } from "lucide-react";

import { FavoriteButton } from "@/components/listings/favorite-button";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { getListingCardInsights } from "@/services/listings/listing-card-insights";
import type { Listing } from "@/types";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const coverImage = listing.images.find((image) => image.isCover) ?? listing.images[0];
  const detailHref = `/listing/${listing.slug}`;
  const insight = getListingCardInsights(listing);
  const toneClasses = {
    amber: {
      badge: "border-amber-300/70 bg-amber-500 text-white",
      panel: "border-amber-100 bg-gradient-to-r from-amber-50 to-background",
      icon: "text-amber-600",
    },
    emerald: {
      badge: "border-emerald-300/70 bg-emerald-500 text-white",
      panel: "border-emerald-100 bg-gradient-to-r from-emerald-50 to-background",
      icon: "text-emerald-600",
    },
    indigo: {
      badge: "border-primary/20 bg-primary text-primary-foreground",
      panel: "border-primary/10 bg-gradient-to-r from-primary/10 to-background",
      icon: "text-primary",
    },
  }[insight.tone];

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-border/70 bg-background shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative">
        <Link href={detailHref} className="block">
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            <Image
              src={coverImage.url}
              alt={listing.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/5 to-transparent" />
            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${toneClasses.badge}`}
              >
                {insight.badgeLabel}
              </span>
              <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm">
                {listing.featured ? "One Cikan" : "Yeni Ilan"}
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-3 text-white">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/35 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                <Camera className="size-3.5" />
                {listing.images.length} fotograf
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/35 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                <Sparkles className="size-3.5" />
                Moderasyon kontrollu
              </div>
            </div>
          </div>
        </Link>

        <FavoriteButton
          listingId={listing.id}
          className="absolute right-3 top-3 size-11"
        />
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <Link href={detailHref} className="block">
              <h3 className="line-clamp-2 text-lg font-semibold tracking-tight transition-colors hover:text-primary">
                {listing.title}
              </h3>
            </Link>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" />
              <span>
                {listing.city} / {listing.district}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {formatCurrency(listing.price)}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {formatDate(listing.updatedAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-muted/50 px-3 py-2">
            <Calendar className="size-3.5" />
            {listing.year}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-muted/50 px-3 py-2">
            <Gauge className="size-3.5" />
            {formatNumber(listing.mileage)} km
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-muted/50 px-3 py-2">
            <Fuel className="size-3.5" />
            {listing.fuelType}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-muted/50 px-3 py-2">
            <Settings2 className="size-3.5" />
            {listing.transmission}
          </span>
        </div>

        <div className={`rounded-[1.25rem] border p-4 ${toneClasses.panel}`}>
          <div className={`flex items-center gap-2 text-sm font-semibold ${toneClasses.icon}`}>
            <Sparkles className="size-4" />
            Hizli ozet
          </div>
          <p className="mt-2 text-sm leading-6 text-foreground/90">{insight.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {insight.highlights.map((highlight) => (
              <span
                key={`${listing.id}-${highlight}`}
                className="rounded-full border border-border/70 bg-background/90 px-3 py-1 text-xs font-semibold text-foreground"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Kart uzerinden ilk eleme yap, detayda satıcı ile gec.
          </p>
          <Link
            href={detailHref}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Ilani incele
          </Link>
        </div>
      </div>
    </article>
  );
}
