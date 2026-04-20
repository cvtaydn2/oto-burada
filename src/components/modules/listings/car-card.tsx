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
        "group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300",
        variant === "grid" ? "flex-col" : "flex flex-row"
      )}
    >
      <div className={cn(
        "relative bg-slate-100 overflow-hidden",
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
            <div className="flex items-center justify-center h-full text-slate-300">
              <CarFront size={48} className="stroke-[1]" />
            </div>
          )}
          {/* Overlay gradient for depth */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
        </Link>
        
        <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
          {/* AI Badge - Subtle Info */}
          <div className={cn(
            "border rounded-full px-4 py-1.5 text-[10px] font-bold text-white flex items-center gap-2 tracking-widest uppercase",
            insights.tone === "emerald" ? "bg-emerald-600/90 border-emerald-400" : 
            insights.tone === "rose" ? "bg-rose-600/90 border-rose-400" :
            insights.tone === "amber" ? "bg-amber-600/90 border-amber-400" :
            "bg-slate-700/90 border-slate-500"
          )}>
            {insights.tone === "emerald" && <Zap size={10} className="fill-current" />}
            {insights.badgeLabel}
          </div>

          {listing.expertInspection?.hasInspection && (
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-full px-4 py-1.5 text-[9px] font-bold text-emerald-700 flex items-center gap-1.5 tracking-widest uppercase">
              <ShieldCheck size={12} className="text-emerald-500" />
              EKSPERTİZLİ
            </div>
          )}

          {listing.seller?.verifiedBusiness && (
            <div className="bg-blue-50/90 border border-blue-200 rounded-full px-4 py-1.5 text-[9px] font-bold text-blue-700 flex items-center gap-1.5 tracking-widest uppercase">
              <ShieldCheck size={12} className="text-blue-500" />
              DOĞRULANMIŞ GALERİ
            </div>
          )}
        </div>

        <div className="absolute right-4 top-4 z-10">
          <FavoriteButton 
            listingId={listing.id}
            className="flex size-10 items-center justify-center rounded-full bg-white/40 text-white transition-all hover:bg-white hover:text-rose-500 border border-white/40 group/fav"
          />
        </div>

        {/* Price Tag Overlay */}
        <div className="absolute left-4 bottom-4 z-10">
           <div className="text-xl font-bold text-white tracking-tighter drop-shadow-md">
             {formatPrice(listing.price)} <span className="text-xs font-semibold opacity-90 uppercase">TL</span>
           </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <Link href={detailHref} className="group/title block">
          <h3 className="font-bold text-[1.1rem] text-slate-900 truncate leading-none tracking-tight group-hover/title:text-slate-600 transition-colors">
            {listing.title}
          </h3>
          <div className="flex items-center gap-2 mt-2.5">
             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">{listing.year}</span>
             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{listing.brand} &middot; {listing.model}</span>
          </div>
        </Link>

        {insights.highlights.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {insights.highlights.slice(0, 3).map(h => (
              <span key={h} className="text-[9px] font-bold uppercase tracking-widest bg-slate-50 text-slate-500 px-2.5 py-1 rounded-md border border-slate-100/60 transition-all">
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Specs Grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-b border-slate-50 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
              <Settings2 size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Şanzıman</span>
              <span className="text-[11px] font-bold text-slate-700 mt-1.5 uppercase">
                {listing.transmission === "yari_otomatik" ? "Yarı Otomatik" : (listing.transmission === "manuel" ? "Manuel" : "Otomatik")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
              <CarFront size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Yakıt</span>
              <span className="text-[11px] font-bold text-slate-700 mt-1.5 uppercase">
                {listing.fuelType === "benzin" ? "Benzin" : (listing.fuelType === "dizel" ? "Dizel" : "Hibrit")}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex flex-col">
             <p className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
               <MapPin size={12} className="text-slate-400" />
               {listing.city} &middot; {listing.district}
             </p>
             <span className="text-sm font-bold text-slate-700 mt-1 tracking-tight">{formatNumber(listing.mileage)} KM</span>
          </div>
          
          <div className="group/btn flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white bg-slate-900 px-6 py-3 rounded-xl hover:bg-black transition-all active:scale-95 cursor-pointer">
            İncele
            <ChevronRight size={14} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </div>
  )
}
