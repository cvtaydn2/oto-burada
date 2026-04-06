import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, ShieldCheck, Sparkles } from "lucide-react";

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

  // Derive dummy flags
  const isPremium = listing.featured;
  const isSuspicious = insight.tone === "amber" && listing.price < 300000;
  
  return (
    <Link
      href={detailHref}
      className={`group flex flex-row bg-white transition-colors hover:bg-slate-50 relative ${
        isPremium ? "bg-indigo-50/10" : ""
      } ${isSuspicious ? "bg-red-50/20" : ""}`}
    >
      {/* Mobile-only favorite button */}
      <div className="absolute right-2 top-2 z-10 md:hidden">
        <FavoriteButton
          listingId={listing.id}
          className="size-7 rounded bg-white/90 shadow-sm backdrop-blur-md"
        />
      </div>

      {/* Image Section */}
      <div className="w-[110px] h-[82px] sm:w-[140px] sm:h-[105px] md:w-[150px] md:h-[114px] shrink-0 p-2 md:pr-0">
        <div className="relative w-full h-full overflow-hidden rounded bg-slate-100">
          {coverImage ? (
            <Image
              src={coverImage.url}
              alt={listing.title}
              fill
              sizes="(min-width: 768px) 150px, 110px"
              className="object-cover"
            />
          ) : null}
          <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[9px] sm:text-[10px] text-white">
            {listing.images.length}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex min-w-0 flex-1 flex-col p-2 sm:p-3 justify-center md:justify-start">
        <div className="flex flex-col md:flex-row md:items-center h-full">
          
          {/* Title and Badges Col */}
          <div className="min-w-0 flex-1 pr-2 md:pr-4 flex flex-col justify-center">
            <h2 className="truncate text-[13px] sm:text-[14px] font-semibold text-slate-900 transition-colors group-hover:text-indigo-700">
              {listing.brand} <span className="font-normal">{listing.model}</span>
            </h2>
            <p className="mt-0.5 truncate text-[11px] sm:text-[13px] text-slate-500 md:text-slate-600">{listing.title}</p>
            
            <div className="mt-1 flex flex-wrap gap-1">
              {isPremium && (
                <span className="inline-flex items-center gap-1 rounded bg-indigo-100 px-1 py-0.5 text-[8px] sm:text-[10px] font-bold text-indigo-700">
                  <Sparkles size={8} className="sm:w-2.5 sm:h-2.5" /> Öne Çıkan
                </span>
              )}
              {insight.tone === "emerald" && (
                <span className="inline-flex items-center rounded bg-emerald-100 px-1 py-0.5 text-[8px] sm:text-[10px] font-bold text-emerald-800">
                  İyi Fiyat
                </span>
              )}
               {isSuspicious && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded bg-red-100 px-1 py-0.5 text-[10px] font-bold text-red-800">
                  <AlertTriangle size={10} /> Uyarı
                </span>
              )}
            </div>

            {/* Mobile inline specs (Year / KM) */}
            <div className="mt-1.5 flex items-center gap-2 text-[11px] font-medium text-slate-500 md:hidden">
              <span>{listing.year}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>{formatNumber(listing.mileage)} km</span>
            </div>
          </div>

          {/* Table-like Columns (Hidden on Mobile) */}
          <div className="mt-3 hidden shrink-0 text-[13px] text-slate-700 md:col-span-1 md:mt-0 md:flex md:items-center">
            <div className="w-16 text-center">{listing.year}</div>
            <div className="w-24 text-right font-medium">{formatNumber(listing.mileage)}</div>
            <div className="w-[88px] text-center">{listing.fuelType === "benzin" ? "Benzin" : listing.fuelType === "dizel" ? "Dizel" : listing.fuelType === "elektrik" ? "Elektrik" : listing.fuelType}</div>
            <div className="w-[88px] text-center">{listing.transmission === "otomatik" ? "Otom." : listing.transmission === "manuel" ? "Manuel" : "Y.Otom."}</div>
          </div>

          {/* Price, Location, Date Column */}
          <div className="mt-auto flex shrink-0 items-end justify-between md:mt-0 md:w-[130px] md:flex-col md:justify-center md:pl-4">
            <div className="text-[14px] sm:text-[15px] font-bold text-slate-900 md:mb-1">
              {formatCurrency(listing.price)}
            </div>
            <div className="text-right hidden sm:block">
              <div className="truncate text-[10px] sm:text-[11px] text-slate-500">
                {listing.city} / {listing.district}
              </div>
              <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400">
                {formatDate(listing.createdAt)}
              </div>
            </div>
            {/* Mobile micro location */}
            <div className="sm:hidden text-[10px] text-slate-400 truncate max-w-[80px]">
              {listing.city}
            </div>
          </div>

        </div>
      </div>

      {/* Desktop Favorite Area */}
      <div className="hidden shrink-0 items-center justify-center md:flex md:w-16 md:border-l md:border-slate-100">
        <FavoriteButton
          listingId={listing.id}
          className="size-8 rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600"
        />
      </div>
    </Link>
  );
}
