"use client"

import Image from "next/image"
import Link from "next/link"
import { 
  Calendar, 
  CircleGauge, 
  Fuel, 
  MapPin, 
  Settings2, 
  Sparkles,
  TrendingDown,
  ArrowRight,
  CarFront
} from "lucide-react"
import { formatNumber } from "@/lib/utils"
import { type Listing } from "@/types"

interface ListingCardProps {
  listing: Listing
  priority?: boolean
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 0,
  }).format(price)
}

export function ListingCard({ listing, priority = false }: ListingCardProps) {
  const coverImage = listing.images.find(img => img.isCover) || listing.images[0]
  const isAdvantageous = (listing.marketPriceIndex ?? 1) < 0.95
  const detailHref = `/listing/${listing.slug}`

  return (
    <Link 
      href={detailHref}
      className="group block showroom-card rounded-[24px] overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image Section - The "Showroom" Frame */}
        <div className="relative w-full sm:w-[300px] aspect-[16/10] sm:aspect-auto shrink-0 bg-secondary/30 overflow-hidden">
          {coverImage ? (
            <Image
              src={coverImage.url}
              alt={listing.title}
              fill
              sizes="(min-width: 640px) 300px, 100vw"
              className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              priority={priority}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground/40">
              <CarFront size={48} className="stroke-[1]" />
            </div>
          )}
          
          {/* Elite Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {listing.featured && (
              <div className="bg-blue-600/95 backdrop-blur shadow-xl text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 transition-all group-hover:bg-blue-500">
                <Sparkles className="w-3.5 h-3.5 fill-white/20" />
                VİTRİN
              </div>
            )}
            {isAdvantageous && (
              <div className="bg-orange-600/95 backdrop-blur shadow-xl text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 transition-all">
                <TrendingDown className="w-3.5 h-3.5" />
                AVANTAJLI
              </div>
            )}
          </div>

          <div className="absolute bottom-4 right-4 px-2.5 py-1.5 bg-black/40 backdrop-blur-md rounded-lg text-[10px] text-white/90 font-black uppercase tracking-widest">
            {listing.images.length} FOTO
          </div>
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* Content Section - Editorial Density */}
        <div className="flex-1 p-6 min-w-0 flex flex-col justify-between bg-card group-hover:bg-primary/5 transition-colors duration-500">
          <div className="space-y-4">
            {/* Title & Price - Elite Pairing */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] mb-1 italic">
                  {listing.brand}
                </div>
                <h3 className="text-xl md:text-2xl font-black text-card-foreground tracking-tight leading-tight truncate group-hover:text-primary transition-colors">
                  {listing.model}
                </h3>
                <p className="text-sm text-muted-foreground font-medium truncate mt-1">
                  {listing.title}
                </p>
              </div>
              <div className="shrink-0 text-left sm:text-right flex flex-col items-end">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tightest text-primary italic">
                    {formatPrice(listing.price)}
                  </span>
                  <span className="text-xs font-black text-primary/40 italic">TL</span>
                </div>
                {isAdvantageous && (
                  <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest mt-1">PAZAR LİDERİ FİYAT</span>
                )}
              </div>
            </div>

            {/* Smart Specs Overlay */}
            <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
              <div className="flex items-center gap-2 group/spec">
                <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover/spec:bg-primary/10 group-hover/spec:text-primary transition-colors outline outline-1 outline-border">
                  <Calendar className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">MODEL</span>
                  <span className="text-xs font-black text-card-foreground">{listing.year}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 group/spec">
                <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover/spec:bg-primary/10 group-hover/spec:text-primary transition-colors outline outline-1 outline-border">
                  <CircleGauge className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">MESAFE</span>
                  <span className="text-xs font-black text-card-foreground">{formatNumber(listing.mileage)} <span className="text-[9px]">KM</span></span>
                </div>
              </div>

              <div className="flex items-center gap-2 group/spec">
                <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover/spec:bg-primary/10 group-hover/spec:text-primary transition-colors outline outline-1 outline-border">
                  <Settings2 className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">VİTES</span>
                  <span className="text-xs font-black text-card-foreground">{listing.transmission}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 group/spec">
                <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover/spec:bg-primary/10 group-hover/spec:text-primary transition-colors outline outline-1 outline-border">
                  <Fuel className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">YAKIT</span>
                  <span className="text-xs font-black text-card-foreground">{listing.fuelType}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer UI */}
          <div className="flex items-center justify-between pt-5 mt-4 border-t border-border">
            <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
              <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shadow-inner">
                <MapPin className="size-3.5 text-primary" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-card-foreground">{listing.city}</span>
            </div>
            
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary group-hover:gap-4 transition-all duration-300 italic">
              DETAYLI İNCELE
              <ArrowRight size={14} className="animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}