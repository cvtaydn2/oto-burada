"use client"

import Image from "next/image"
import Link from "next/link"
import { CarFront, MapPin, Settings2, ShieldCheck, Zap } from "lucide-react"
import { cn, formatNumber } from "@/lib/utils"
import { type Listing } from "@/types"
import { FavoriteButton } from "@/components/listings/favorite-button"
import { getListingCardInsights } from "@/services/listings/listing-card-insights"

interface CarCardProps {
  listing: Listing
  priority?: boolean
  variant?: "grid" | "list"
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 0,
  }).format(price)
}

export function CarCard({ listing, priority = false, variant = "grid" }: CarCardProps) {
  const images = Array.isArray(listing.images) ? listing.images : []
  const coverImage = images.find(img => img.isCover) || images[0]
  const detailHref = `/listing/${listing.slug}`
  
  // AI Insights calculation
  const insights = getListingCardInsights(listing)

  return (
    <div 
      className={cn(
        "group relative block overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:shadow-lg",
        variant === "grid" ? "flex-col" : "flex flex-row"
      )}
    >
      <div className={cn(
        "relative bg-gray-100",
        variant === "grid" ? "aspect-[16/10]" : "aspect-[16/10] w-[260px] shrink-0"
      )}>
        <Link href={detailHref} className="block w-full h-full">
          {coverImage ? (
            <Image
              src={coverImage.url}
              alt={listing.title}
              fill
              sizes={variant === "grid" ? "(min-width: 1024px) 33vw, 50vw" : "320px"}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority={priority}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300">
              <CarFront size={48} className="stroke-[1]" />
            </div>
          )}
        </Link>
        
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
          {/* AI Badge */}
          <div className={cn(
            "rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg flex items-center gap-1.5",
            insights.tone === "emerald" ? "bg-emerald-500 shadow-emerald-500/20" : 
            insights.tone === "rose" ? "bg-rose-500 shadow-rose-500/20" :
            insights.tone === "amber" ? "bg-amber-500 shadow-amber-500/20" :
            "bg-blue-600 shadow-blue-600/20"
          )}>
            {insights.tone === "emerald" && <Zap size={12} className="fill-current" />}
            {insights.badgeLabel}
          </div>

          {listing.expertInspection && (
            <div className="rounded-lg bg-white/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-blue-600 shadow-sm border border-blue-100 flex items-center gap-1">
              <ShieldCheck size={12} />
              EKSPERTİZLİ
            </div>
          )}
        </div>

        <div className="absolute right-3 top-3 z-10">
          <FavoriteButton 
            listingId={listing.id}
            className="flex size-8 items-center justify-center rounded-full bg-white/80 text-gray-500 shadow-sm transition-all hover:bg-white hover:text-red-500 backdrop-blur-sm"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Link href={detailHref} className="group-hover:text-blue-500 transition-colors">
          <h3 className="font-bold text-lg text-gray-800 truncate leading-tight">
            {listing.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-sm text-gray-500 font-medium">{listing.year}</span>
             <span className="size-1 rounded-full bg-gray-300" />
             <span className="text-xs text-blue-500 font-bold">{listing.brand} {listing.model}</span>
          </div>
        </Link>

        {/* Insight Highlights */}
        {insights.highlights.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {insights.highlights.map(h => (
              <span key={h} className="text-[9px] font-bold uppercase tracking-wider bg-gray-50 text-gray-500 px-2 py-1 rounded border border-gray-100">
                {h}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-b border-gray-100 pb-3 text-[11px] font-medium text-gray-400">
          <span className="flex items-center gap-1.5 capitalize">
            <Settings2 size={13} className="text-gray-300" />
            {listing.transmission === "yari_otomatik" ? "Yarı Otomatik" : listing.transmission}
          </span>
          <span className="flex items-center gap-1.5 capitalize">
            <CarFront size={13} className="text-gray-300" />
            {listing.fuelType}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <MapPin size={12} className="text-gray-300" />
            {listing.city}, {listing.district}
          </p>
          <div className="flex items-center justify-between mt-1">
            <div className="text-xl font-bold text-blue-500 tracking-tight">
              {formatPrice(listing.price)} TL
            </div>
            {insights.fairValue && insights.fairValue > listing.price && (
              <div className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 animate-pulse">
                FIRSAT
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-xs font-bold text-gray-400">{formatNumber(listing.mileage)} KM</span>
          <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-500">
            Detaylar
            <svg className="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
