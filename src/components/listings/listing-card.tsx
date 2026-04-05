import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Fuel,
  Gauge,
  MapPin,
  Settings2,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { FavoriteButton } from "@/components/listings/favorite-button";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { getListingCardInsights } from "@/services/listings/listing-card-insights";
import type { Listing } from "@/types";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const coverImage = listing.images.find((image) => image.isCover) ?? listing.images[0];
  const detailHref = `/listing/${listing.slug}`;
  const insight = getListingCardInsights(listing);

  // Derive some "premium" and "trust" dummy flags for MVP UI
  const isPremium = listing.featured;
  const isSuspicious = insight.tone === "amber" && listing.price < 300000;
  
  return (
    <Link
      href={detailHref}
      className={`group relative block overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:shadow-xl ${
        isPremium ? "border-indigo-200" : "border-slate-200"
      } ${isSuspicious ? "border-red-300" : ""}`}
    >
      {/* Compare Checkbox could go here if implemented, for now Favorite Button */}
      <div className="absolute left-4 top-4 z-20">
        <FavoriteButton
          listingId={listing.id}
          className="size-8 rounded-lg border border-slate-200 bg-white/90 shadow-sm backdrop-blur-md transition-colors hover:bg-slate-50"
        />
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Image Section */}
        <div className="relative h-64 w-full shrink-0 overflow-hidden bg-slate-100 md:h-auto md:w-[340px]">
          {coverImage ? (
            <Image
              src={coverImage.url}
              alt={listing.title}
              fill
              sizes="(min-width: 768px) 340px, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : null}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

          <div className="absolute right-4 top-4 z-10 flex flex-col items-end gap-2">
            {insight.tone === "emerald" && (
              <div className="flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                <TrendingDown size={14} /> IYI FIYAT
              </div>
            )}
            {insight.tone === "amber" && (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                <TrendingUp size={14} /> YUKSEK FIYAT
              </div>
            )}
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg border border-white/20 bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
                1/{listing.images.length} Fotograf
              </div>
              {isPremium && (
                <div className="flex items-center gap-1 rounded-lg border border-indigo-400/30 bg-indigo-500/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
                  <Sparkles size={12} /> Premium
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex min-w-0 flex-1 flex-col justify-between bg-white p-6">
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Main Info */}
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <h2 className="truncate text-xl font-semibold text-slate-900 transition-colors group-hover:text-indigo-600">
                    {listing.brand} <span className="font-normal text-slate-500">{listing.model}</span>
                  </h2>
                  <p className="line-clamp-1 mt-1 text-base text-slate-600">{listing.title}</p>
                </div>
              </div>

              {/* Quick Specs Grid */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                  <Calendar size={16} className="text-slate-400" /> {listing.year}
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                  <Gauge size={16} className="text-slate-400" /> {formatNumber(listing.mileage)} km
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                  <Fuel size={16} className="text-slate-400" /> {listing.fuelType}
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                  <Settings2 size={16} className="text-slate-400" /> {listing.transmission}
                </div>
              </div>

              {/* AI Insights */}
              {!isSuspicious && insight.highlights.length > 0 && (
                <div className="rounded-xl border border-indigo-100/50 bg-gradient-to-r from-indigo-50 to-blue-50/30 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles size={16} className="text-indigo-600" />
                    <span className="text-sm font-semibold text-indigo-900">Yapay Zeka Analizi</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {insight.highlights.slice(0, 2).map((h, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-indigo-500" />
                        <span className="line-clamp-1">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isSuspicious && (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <strong className="font-semibold">Supheli Ilan Uyarisi:</strong> Fiyat piyasa ortalamasinin cok altinda. Kapora gondermeyin.
                </div>
              )}
            </div>

            {/* Price & Trust Column */}
            <div className="flex w-full shrink-0 flex-col items-start justify-between border-t border-slate-100 pt-4 lg:w-48 lg:items-end lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <div className="mb-4 w-full text-left lg:mb-0 lg:text-right">
                <div className="text-2xl font-bold tracking-tight text-slate-900">
                  {formatCurrency(listing.price)}
                </div>
              </div>

              <div className="w-full space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={16} className="text-slate-400" />
                  <span className="truncate">
                    {listing.city} / {listing.district}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900">
                  <div className="flex size-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    S
                  </div>
                  <span className="flex-1 truncate">Satici</span>
                  <span title="Onaylı Satıcı" className="flex items-center">
                    <ShieldCheck size={16} className="shrink-0 text-blue-500" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
