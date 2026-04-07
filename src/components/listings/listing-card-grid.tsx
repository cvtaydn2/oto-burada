import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { FavoriteButton } from "@/components/listings/favorite-button";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { getListingCardInsights } from "@/services/listings/listing-card-insights";
import type { Listing } from "@/types";

interface ListingCardGridProps {
  listing: Listing;
}

export function ListingCardGrid({ listing }: ListingCardGridProps) {
  const coverImage = listing.images.find((image) => image.isCover) ?? listing.images[0];
  const detailHref = `/listing/${listing.slug}`;
  const insight = getListingCardInsights(listing);

  return (
    <Link
      href={detailHref}
      className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/60 overflow-hidden transition-all hover:shadow-lg hover:border-indigo-200 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-100">
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={listing.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
            Resim yok
          </div>
        )}
        <div className="absolute top-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-xs font-medium text-white">
          {listing.images.length}
        </div>
        {listing.featured && (
          <div className="absolute top-2 left-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-1 text-xs font-bold text-white flex items-center gap-1">
            <Sparkles size={10} />
            Öne Çıkan
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3 space-y-2">
        <h2 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600">
          {listing.brand} {listing.model}
        </h2>
        
        <p className="text-xs text-slate-500 line-clamp-1">{listing.title}</p>

        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span className="bg-slate-100 px-1.5 py-0.5 rounded">{listing.year}</span>
          <span className="bg-slate-100 px-1.5 py-0.5 rounded">{formatNumber(listing.mileage)} km</span>
        </div>

        {insight.tone === "emerald" && (
          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            İyi Fiyat
          </span>
        )}

        <div className="mt-auto pt-2 flex items-end justify-between">
          <p className="text-base font-bold text-slate-900">
            {formatCurrency(listing.price)}
          </p>
          <p className="text-[10px] text-slate-500">{listing.city}</p>
        </div>
      </div>

      <div className="absolute top-2 right-2 z-10">
        <FavoriteButton
          listingId={listing.id}
          className="size-8 rounded-full bg-white/90 shadow-md backdrop-blur-md flex items-center justify-center"
        />
      </div>
    </Link>
  );
}