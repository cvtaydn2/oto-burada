import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Sparkles, Heart } from "lucide-react";

import { FavoriteButton } from "@/components/listings/favorite-button";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { getListingCardInsights } from "@/services/listings/listing-card-insights";
import type { Listing } from "@/types";

interface ListingCardProps {
  listing: Listing;
  priority?: boolean;
}

export function ListingCard({ listing, priority = false }: ListingCardProps) {
  const coverImage = listing.images.find((image) => image.isCover) ?? listing.images[0];
  const detailHref = `/listing/${listing.slug}`;
  const insight = getListingCardInsights(listing);

  const isPremium = listing.featured;
  const isSuspicious = insight.tone === "amber" && listing.price < 300000;
  
  return (
    <article className="group relative flex flex-col sm:flex-row bg-white rounded-2xl border border-slate-200/60 overflow-hidden transition-all hover:shadow-lg hover:border-indigo-200 hover:-translate-y-0.5">
      {/* Mobile Favorite Button */}
      <div className="absolute right-3 top-3 z-10 sm:hidden">
        <FavoriteButton
          listingId={listing.id}
          className="size-9 rounded-full bg-white/90 shadow-md backdrop-blur-md flex items-center justify-center"
        />
      </div>

      {/* Image Section */}
      <div className="relative w-full sm:w-[180px] h-[160px] sm:h-[140px] shrink-0 overflow-hidden bg-slate-100">
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={`${listing.brand} ${listing.model} - ${listing.year}`}
            fill
            sizes="(min-width: 640px) 180px, 100vw"
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400" role="img" aria-label="Görsel yok">
            <span>Resim yok</span>
          </div>
        )}
        {/* Image count badge */}
        <div className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-xs font-medium text-white flex items-center gap-1" aria-label={`${listing.images.length} fotoğraf`}>
          <span>{listing.images.length}</span>
          <span className="text-[10px] opacity-80">foto</span>
        </div>
        {/* Premium badge */}
        {isPremium && (
          <div className="absolute top-2 left-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-1 text-xs font-bold text-white shadow-md flex items-center gap-1" aria-label="Öne çıkan ilan">
            <Sparkles size={10} aria-hidden="true" />
            Öne Çıkan
          </div>
        )}
      </div>

      {/* Content Section */}
      <Link 
        href={detailHref}
        className="flex flex-1 flex-col p-4 justify-between min-w-0"
        aria-label={`${listing.brand} ${listing.model} - ${formatCurrency(listing.price)}`}
      >
        <div className="space-y-2">
          {/* Title */}
          <h2 className="text-base font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
            {listing.brand} <span className="font-medium">{listing.model}</span>
          </h2>
          
          {/* Subtitle */}
          <p className="text-sm text-slate-500 truncate">{listing.title}</p>
          
          {/* Specs Row */}
          <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md" aria-label={`Yıl: ${listing.year}`}>
              <span>{listing.year}</span>
            </span>
            <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md" aria-label={`Kilometre: ${formatNumber(listing.mileage)}`}>
              <span>{formatNumber(listing.mileage)} km</span>
            </span>
            <span className="hidden sm:flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md" aria-label={`Yakıt: ${listing.fuelType}`}>
              <span>{listing.fuelType === "benzin" ? "Benzin" : listing.fuelType === "dizel" ? "Dizel" : listing.fuelType === "elektrik" ? "Elektrik" : listing.fuelType}</span>
            </span>
            <span className="hidden sm:flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md" aria-label={`Vites: ${listing.transmission}`}>
              <span>{listing.transmission === "otomatik" ? "Otomatik" : listing.transmission === "manuel" ? "Manuel" : "Yarı Otomatik"}</span>
            </span>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5" role="status" aria-live="polite">
            {insight.tone === "emerald" && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
                İyi Fiyat
              </span>
            )}
            {isSuspicious && (
              <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-100" role="alert">
                <AlertTriangle size={10} className="mr-1" aria-hidden="true" />
                Dikkat
              </span>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between mt-3 pt-3 border-t border-slate-100">
          <div aria-label={`Fiyat: ${formatCurrency(listing.price)} TL`}>
            <p className="text-xl font-bold text-slate-900">
              {formatCurrency(listing.price)}
              <span className="text-xs font-medium text-slate-500 ml-1">TL</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-slate-500" aria-label={`Konum: ${listing.city}`}>
              {listing.city}
            </p>
            <p className="text-[10px] text-slate-400">
              {formatDate(listing.createdAt)}
            </p>
          </div>
        </div>
      </Link>

      {/* Desktop Favorite */}
      <div className="hidden sm:flex absolute right-3 top-3">
        <FavoriteButton
          listingId={listing.id}
          className="size-9 rounded-full bg-white/90 shadow-md backdrop-blur-md flex items-center justify-center"
        />
      </div>
    </article>
  );
}