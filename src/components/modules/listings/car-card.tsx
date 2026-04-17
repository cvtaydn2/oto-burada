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
        "group relative block overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-white transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] hover:-translate-y-2",
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
              className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
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
          {/* AI Badge - Premium Glassmorphism */}
          <div className={cn(
            "backdrop-blur-xl border border-white/30 rounded-full px-4 py-1.5 text-[10px] font-black text-white shadow-xl flex items-center gap-2 tracking-widest uppercase",
            insights.tone === "emerald" ? "bg-emerald-500/80" : 
            insights.tone === "rose" ? "bg-rose-500/80" :
            insights.tone === "amber" ? "bg-amber-500/80" :
            "bg-indigo-600/80"
          )}>
            {insights.tone === "emerald" && <Zap size={10} className="fill-current animate-pulse" />}
            {insights.badgeLabel}
          </div>

          {listing.expertInspection && (
            <div className="backdrop-blur-xl bg-white/90 border border-emerald-100/30 rounded-full px-4 py-1.5 text-[9px] font-black text-emerald-700 shadow-xl flex items-center gap-1.5 tracking-widest uppercase">
              <ShieldCheck size={12} className="text-emerald-500" />
              EKSPERTİZLİ
            </div>
          )}
        </div>

        <div className="absolute right-4 top-4 z-10">
          <FavoriteButton 
            listingId={listing.id}
            className="flex size-10 items-center justify-center rounded-full bg-white/20 text-white shadow-xl transition-all hover:bg-white hover:text-rose-500 backdrop-blur-md border border-white/40 group/fav"
          />
        </div>

        {/* Price Tag Overlay (Mobile view or grid highlight) */}
        <div className="absolute left-4 bottom-4 z-10">
           <div className="text-xl font-black text-white tracking-tighter drop-shadow-lg">
             {formatPrice(listing.price)} <span className="text-xs font-bold opacity-80 uppercase">TL</span>
           </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <Link href={detailHref} className="group/title block">
          <h3 className="font-black text-[1.15rem] text-slate-900 truncate leading-none tracking-tight group-hover/title:text-indigo-600 transition-colors">
            {listing.title}
          </h3>
          <div className="flex items-center gap-2 mt-2">
             <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md">{listing.year}</span>
             <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{listing.brand} &middot; {listing.model}</span>
          </div>
        </Link>

        {/* Mini Badges Highlights */}
        {insights.highlights.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {insights.highlights.map(h => (
              <span key={h} className="text-[9px] font-black uppercase tracking-widest bg-slate-50 text-slate-500 px-3 py-1.5 rounded-xl border border-slate-100/60 transition-all hover:bg-white hover:border-indigo-100 hover:text-indigo-600">
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
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">Şanzıman</span>
              <span className="text-[11px] font-black text-slate-700 mt-1 uppercase">
                {listing.transmission === "yari_otomatik" ? "Yarı Otomatik" : (listing.transmission === "manuel" ? "Manuel" : "Otomatik")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
              <CarFront size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">Yakıt</span>
              <span className="text-[11px] font-black text-slate-700 mt-1 uppercase">
                {listing.fuelType === "benzin" ? "Benzin" : (listing.fuelType === "dizel" ? "Dizel" : "Hibrit")}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex flex-col">
             <p className="flex items-center gap-1.5 text-[10px] text-slate-400 font-black uppercase tracking-widest">
               <MapPin size={12} className="text-slate-300" />
               {listing.city} &middot; {listing.district}
             </p>
             <span className="text-sm font-black text-slate-700 mt-1 tracking-tight">{formatNumber(listing.mileage)} KM</span>
          </div>
          
          <div className="group/btn flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white bg-slate-900 px-6 py-3 rounded-2xl shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:shadow-indigo-200 transition-all active:scale-90 cursor-pointer">
            İncele
            <ChevronRight size={14} strokeWidth={4} className="group-hover/btn:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  )
}
