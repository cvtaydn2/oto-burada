"use client"

import Image from "next/image"
import Link from "next/link"
import { CarFront, MapPin, Settings2, ShieldCheck, Zap, ChevronRight } from "lucide-react"
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
        "group relative block overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:shadow-sm",
        variant === "grid" ? "flex-col" : "flex flex-row"
      )}
    >
      <div className={cn(
        "relative bg-muted overflow-hidden",
        variant === "grid" ? "aspect-[16/10]" : "aspect-[16/11] w-[300px] shrink-0"
      )}>
        <Link href={detailHref} className="relative block h-full w-full">
          {coverImage ? (
            <Image
              src={supabaseImageUrl(coverImage.url, variant === "grid" ? 600 : 400, 80)}
              alt={listing.title}
              fill
              sizes={variant === "grid" ? "(min-width: 1024px) 33vw, 50vw" : "320px"}
              className="object-cover transition-opacity duration-300"
              fetchPriority={priority ? "high" : "auto"}
              loading={priority ? "eager" : "lazy"}
              priority={priority}
              placeholder={coverImage.placeholderBlur ? "blur" : "empty"}
              blurDataURL={coverImage.placeholderBlur ?? undefined}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground/30">
              <CarFront size={48} className="stroke-[1]" />
            </div>
          )}
          {/* Overlay gradient for depth */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
        </Link>
        
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
          {/* AI Badge - Calm UI */}
          <div className={cn(
            "rounded-md px-2.5 py-1 text-[9px] font-bold flex items-center gap-1.5 uppercase tracking-widest backdrop-blur-md",
            insights.tone === "emerald" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : 
            insights.tone === "rose" ? "bg-rose-500/10 text-rose-600 border border-rose-500/20" :
            insights.tone === "amber" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
            "bg-muted/80 text-muted-foreground border border-border/50"
          )}>
            {insights.tone === "emerald" && <Zap size={10} className="fill-current" />}
            {insights.badgeLabel}
          </div>

          {listing.expertInspection?.hasInspection && (
            <div className="bg-primary/10 text-primary border border-primary/20 rounded-md px-2.5 py-1 text-[9px] font-bold flex items-center gap-1.5 uppercase tracking-widest backdrop-blur-md">
              <ShieldCheck size={10} />
              EKSPERTİZLİ
            </div>
          )}
        </div>

        <div className="absolute right-3 top-3 z-10">
          <FavoriteButton 
            listingId={listing.id}
            className="flex size-9 items-center justify-center rounded-full bg-white/20 text-white transition-all hover:bg-white hover:text-rose-500 border border-white/20 backdrop-blur-sm group/fav"
          />
        </div>

        {/* Price Tag Overlay - High Visibility */}
        <div className="absolute left-3 bottom-3 z-10">
           <div className="bg-background/90 backdrop-blur-md border border-border px-3 py-1.5 rounded-lg shadow-sm">
             <span className="text-lg font-bold text-foreground tracking-tight">
               {formatPrice(listing.price)}
             </span>
             <span className="ml-1 text-[10px] font-bold text-muted-foreground uppercase">TL</span>
           </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <Link href={detailHref} className="group/title block">
          <h3 className="font-bold text-base text-card-foreground truncate leading-none tracking-tight group-hover/title:text-primary transition-colors">
            {listing.title}
          </h3>
          <div className="flex items-center gap-2 mt-2">
             <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-muted/60 px-2.5 py-1 rounded-md">{listing.year}</span>
             <span className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-widest leading-none">{listing.brand} &middot; {listing.model}</span>
          </div>
        </Link>

        {insights.highlights.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {insights.highlights.slice(0, 3).map(h => (
              <span key={h} className="text-[9px] font-bold uppercase tracking-widest bg-muted text-muted-foreground/80 px-2.5 py-1 rounded-md border border-border/50 transition-all">
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Specs Grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-b border-border/40 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-muted/40 flex items-center justify-center text-muted-foreground/60">
              <Settings2 size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none">Şanzıman</span>
              <span className="text-[11px] font-bold text-foreground mt-1.5 uppercase">
                {listing.transmission === "yari_otomatik" ? "Yarı Otomatik" : (listing.transmission === "manuel" ? "Manuel" : "Otomatik")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-muted/40 flex items-center justify-center text-muted-foreground/60">
              <CarFront size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none">Yakıt</span>
              <span className="text-[11px] font-bold text-foreground mt-1.5 uppercase">
                {listing.fuelType === "benzin" ? "Benzin" : (listing.fuelType === "dizel" ? "Dizel" : "Hibrit")}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex flex-col">
             <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">
               <MapPin size={10} className="text-muted-foreground/40" />
               {listing.city} &middot; {listing.district}
             </p>
             <span className="text-sm font-bold text-foreground mt-1.5 tracking-tight">{formatNumber(listing.mileage)} <span className="text-[9px] uppercase tracking-widest opacity-60">KM</span></span>
          </div>
          
          <div className="group/btn flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary-foreground bg-primary px-5 py-3 rounded-xl hover:opacity-90 transition-all active:scale-95 cursor-pointer shadow-sm">
            İncele
            <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  )
}
