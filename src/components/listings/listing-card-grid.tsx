"use client"

import Image from "next/image"
import Link from "next/link"
import { 
  CarFront, 
  Sparkles, 
  TrendingDown, 
  Zap, 
  Flame, 
  Calendar, 
  CircleGauge, 
  MapPin 
} from "lucide-react"
import { formatNumber, formatPrice, supabaseImageUrl } from "@/lib/utils"
import { type Listing } from "@/types"
import { FavoriteButton } from "@/components/listings/favorite-button"
import { cn } from "@/lib/utils"

interface ListingCardGridProps {
  listing: Listing
  priority?: boolean
}

export function ListingCardGrid({ listing, priority = false }: ListingCardGridProps) {
  const coverImage = listing.images.find(img => img.isCover) || listing.images[0]
  const isAdvantageous = (listing.marketPriceIndex ?? 1) < 0.95
  const now = new Date().toISOString()
  const isFeaturedActive = listing.featured && (!listing.featuredUntil || listing.featuredUntil > now)
  const isUrgentActive = !!listing.urgentUntil && listing.urgentUntil > now
  const isHighlightedActive = !!listing.highlightedUntil && listing.highlightedUntil > now

  return (
    <Link 
      href={`/listing/${listing.slug}`}
      className={cn(
        "group relative flex flex-col bg-white rounded-[2rem] border border-slate-100 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1.5",
        isHighlightedActive && "ring-2 ring-purple-500/20 bg-gradient-to-b from-purple-50/30 to-white"
      )}
    >
      {/* Visual Header / Image Box */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
        {coverImage ? (
          <Image
            src={supabaseImageUrl(coverImage.url, 400, 75)}
            alt={listing.title}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-200">
            <CarFront size={64} strokeWidth={1} />
          </div>
        )}
        
        {/* Elite Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Dynamic Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none">
          {isFeaturedActive && (
            <div className="flex h-7 items-center gap-1.5 rounded-lg bg-blue-600/90 px-3 text-[9px] font-black uppercase tracking-widest text-white backdrop-blur shadow-lg">
              <Sparkles size={12} className="fill-white/20" />
              Vitrin
            </div>
          )}
          {isUrgentActive && (
            <div className="flex h-7 items-center gap-1.5 rounded-lg bg-rose-600/90 px-3 text-[9px] font-black uppercase tracking-widest text-white backdrop-blur shadow-lg">
              <Zap size={12} className="fill-white/20" />
              Acil
            </div>
          )}
          {isHighlightedActive && (
            <div className="flex h-7 items-center gap-1.5 rounded-lg bg-purple-600/90 px-3 text-[9px] font-black uppercase tracking-widest text-white backdrop-blur shadow-lg">
              <Flame size={12} className="fill-white/20" />
              Elite
            </div>
          )}
        </div>

        {/* Price Floating Tag */}
        <div className="absolute bottom-4 left-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-1.5 rounded-xl shadow-2xl">
            <span className="text-xl font-black text-white italic tracking-tighter">
              {formatPrice(listing.price)}
              <span className="ml-1 text-[10px] opacity-70">TL</span>
            </span>
          </div>
        </div>

        {/* Action Controls Overlay */}
        <div className="absolute top-4 right-4 z-10">
          <FavoriteButton
            listingId={listing.id}
            className="size-10 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white hover:text-rose-500 transition-all duration-300 shadow-xl"
          />
        </div>

        {/* Content Meta (City, Image Count) */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
           <div className="flex h-6 items-center gap-1.5 rounded-lg bg-black/40 px-2.5 text-[9px] font-black text-white/90 backdrop-blur-md uppercase tracking-widest">
            <MapPin size={10} />
            {listing.city}
          </div>
          <div className="flex h-6 items-center px-2.5 rounded-lg bg-black/40 text-[9px] font-black text-white/90 backdrop-blur-md uppercase tracking-widest">
            {listing.images.length} FOTO
          </div>
        </div>
      </div>

      {/* Editorial Details */}
      <div className="flex flex-col p-6 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{listing.brand}</span>
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{listing.year}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight line-clamp-1 group-hover:text-blue-600 transition-colors">
            {listing.model}
          </h2>
          <p className="mt-1 text-xs font-bold text-slate-400 line-clamp-1 italic">{listing.title}</p>
        </div>

        {/* Technical Snapshot */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
              <CircleGauge size={14} />
            </div>
            <span className="text-xs font-black text-slate-700 tracking-tight">{formatNumber(listing.mileage)} <span className="text-[10px] text-slate-400">km</span></span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
              <Calendar size={14} />
            </div>
             <span className="text-xs font-black text-slate-700 tracking-tight uppercase tracking-widest">{listing.transmission?.[0]}</span>
          </div>
        </div>

        {/* Market Insights */}
        {isAdvantageous && (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100/50">
            <TrendingDown size={14} className="text-emerald-600" />
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Pazarın Altında Fiyat</span>
          </div>
        )}
      </div>
    </Link>
  )
}