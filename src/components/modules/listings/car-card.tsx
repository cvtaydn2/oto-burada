"use client"

import Image from "next/image"
import Link from "next/link"
import { CarFront, MapPin, Settings2, ShieldCheck, Zap } from "lucide-react"
import { cn, formatNumber, formatPrice, supabaseImageUrl } from "@/lib/utils"
import { type Listing } from "@/types"
import { FavoriteButton } from "@/components/listings/favorite-button"
import { getListingCardInsights } from "@/services/listings/listing-card-insights"

interface CarCardProps {
  listing: Listing
  priority?: boolean
  variant?: "grid" | "list"
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
        "group relative block overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-lg",
        variant === "grid" ? "flex-col" : "flex flex-row"
      )}
    >
      <div className={cn(
        "relative bg-muted",
        variant === "grid" ? "aspect-[16/10]" : "aspect-[16/10] w-[260px] shrink-0"
      )}>
        <Link href={detailHref} className="relative block h-full w-full">
          {coverImage ? (
            <Image
              src={supabaseImageUrl(coverImage.url, variant === "grid" ? 600 : 400, 80)}
              alt={listing.title}
              fill
              sizes={variant === "grid" ? "(min-width: 1024px) 33vw, 50vw" : "320px"}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              fetchPriority={priority ? "high" : "auto"}
              loading={priority ? "eager" : "lazy"}
              priority={priority}
              placeholder={coverImage.placeholderBlur ? "blur" : "empty"}
              blurDataURL={coverImage.placeholderBlur ?? undefined}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground/40">
              <CarFront size={48} className="stroke-[1]" />
            </div>
          )}
        </Link>
        
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
          {/* AI Badge */}
          <div className={cn(
            "rounded-full px-3 py-1 text-[11px] font-bold text-white shadow-lg flex items-center gap-1.5",
            insights.tone === "emerald" ? "bg-emerald-500 shadow-emerald-500/20" : 
            insights.tone === "rose" ? "bg-rose-500 shadow-rose-500/20" :
            insights.tone === "amber" ? "bg-amber-500 shadow-amber-500/20" :
            "bg-blue-600 shadow-blue-600/20"
          )}>
            {insights.tone === "emerald" && <Zap size={12} className="fill-current" />}
            {insights.badgeLabel}
          </div>

          {listing.expertInspection && (
            <div className="rounded-lg bg-background/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-primary shadow-sm border border-primary/20 flex items-center gap-1">
              <ShieldCheck size={12} />
              EKSPERTİZLİ
            </div>
          )}
        </div>

        <div className="absolute right-3 top-3 z-10">
          <FavoriteButton 
            listingId={listing.id}
            className="flex size-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow-sm transition-all hover:bg-background hover:text-red-500 backdrop-blur-sm"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Link href={detailHref} className="group-hover:text-primary transition-colors">
          <h3 className="font-bold text-lg text-card-foreground truncate leading-tight">
            {listing.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-sm text-muted-foreground font-medium">{listing.year}</span>
             <span className="size-1 rounded-full bg-border" />
             <span className="text-xs text-primary font-bold">{listing.brand} {listing.model}</span>
          </div>
        </Link>

        {/* Insight Highlights */}
        {insights.highlights.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {insights.highlights.map(h => (
              <span key={h} className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-1 rounded-full border border-border">
                {h}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-b border-border pb-3 text-[11px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5 capitalize">
            <Settings2 size={13} className="text-muted-foreground/50" />
            {listing.transmission === "yari_otomatik" ? "Yarı Otomatik" : listing.transmission}
          </span>
          <span className="flex items-center gap-1.5 capitalize">
            <CarFront size={13} className="text-muted-foreground/50" />
            {listing.fuelType}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <MapPin size={12} className="text-muted-foreground/50" />
            {listing.city}, {listing.district}
          </p>
          <div className="flex items-center justify-between mt-1">
            <div className="text-xl font-bold text-primary tracking-tight">
              {formatPrice(listing.price)} TL
            </div>
            {insights.fairValue && insights.fairValue > listing.price && (
              <div className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-800 animate-pulse">
                FIRSAT
              </div>
            )}
          </div>
        </div>

          <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3">
            <span className="text-xs font-bold text-muted-foreground">{formatNumber(listing.mileage)} KM</span>
            <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary">
            İncele
            <svg className="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
