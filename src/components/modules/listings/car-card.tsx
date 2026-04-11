"use client"

import Image from "next/image"
import Link from "next/link"
import { CarFront, Calendar, Gauge, MapPin, Sparkles, TrendingDown, Clock, ShieldCheck, Camera, Zap } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import { type Listing } from "@/types"
import { Badge } from "@/components/ui/badge"
import { FavoriteButton } from "@/components/listings/favorite-button"
import { cn } from "@/lib/utils"

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
  // Enhanced cover image selection logic to prevent mismatches if data is inconsistent
  const coverImage = listing.images.find(img => img.isCover) || listing.images[0]
  
  // Logic for Advantageous Price (Conversion Booster)
  const isAdvantageous = (listing.marketPriceIndex ?? 1) < 0.95
  const isFairPrice = (listing.marketPriceIndex ?? 1) >= 0.95 && (listing.marketPriceIndex ?? 1) <= 1.05
  
  // Logic for Trust (Conversion Booster)
  const isHighTrust = (listing.fraudScore ?? 0) < 10

  const isUrgent = listing.urgentUntil ? new Date(listing.urgentUntil) > new Date() : false

  if (variant === "list") {
    return (
      <Link 
        href={`/listing/${listing.slug}`}
        className="group relative flex flex-col sm:flex-row bg-card rounded-2xl border border-border overflow-hidden hover:ring-2 hover:ring-primary/20 hover:shadow-xl transition-all duration-300"
      >
        {/* Horizontal Card stays similar but more refined */}
        <div className="relative w-full sm:w-64 aspect-[4/3] sm:aspect-square overflow-hidden bg-muted">
           {/* ... Image implementation ... */}
        </div>
        {/* ... Rest of list component ... */}
      </Link>
    )
  }

  return (
    <Link 
      href={`/listing/${listing.slug}`}
      className="group relative flex flex-col bg-card rounded-2xl border border-border overflow-hidden card-shadow transition-all duration-300"
    >
      {/* Top Section: Visuals & Badges */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted">
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={`${listing.brand} ${listing.model} ${listing.year}`}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-2">
            <CarFront className="w-10 h-10 stroke-[1.5]" />
            <span className="text-xs font-medium">Görsel Yok</span>
          </div>
        )}
        
        {/* Modern Badges Layer */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {listing.featured && (
            <Badge className="bg-amber-500/90 hover:bg-amber-500 backdrop-blur-md text-white border-none shadow-sm px-2 py-1">
              <Sparkles className="w-3 h-3 mr-1 fill-current" />
              Vitrin
            </Badge>
          )}
          {isUrgent && (
            <Badge className="bg-red-600/90 hover:bg-red-600 backdrop-blur-md text-white border-none shadow-sm px-2 py-1 font-black animate-pulse">
              <Zap className="w-3 h-3 mr-1 fill-current" />
              ACİL
            </Badge>
          )}
          {listing.seller?.userType === "professional" ? (
            <Badge className="bg-indigo-600/90 hover:bg-indigo-600 backdrop-blur-md text-white border-none shadow-sm px-2 py-1">
              Galeriden
            </Badge>
          ) : (
            <Badge className="bg-slate-700/80 hover:bg-slate-700 backdrop-blur-md text-white border-none shadow-sm px-2 py-1">
              Sahibinden
            </Badge>
          )}
          {listing.seller?.identityVerified && (
            <Badge className="bg-blue-500/90 hover:bg-blue-500 backdrop-blur-md text-white border-none shadow-sm px-2 py-1">
              <ShieldCheck className="w-3 h-3 mr-1" />
              EİDS Doğrulanmış
            </Badge>
          )}
          {isAdvantageous && (
            <Badge className="bg-emerald-500/90 hover:bg-emerald-500 backdrop-blur-md text-white border-none shadow-sm px-2 py-1">
              <TrendingDown className="w-3 h-3 mr-1" />
              Fırsat
            </Badge>
          )}
        </div>

        {/* Favorite & Interaction Overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <FavoriteButton
            listingId={listing.id}
            className="size-9 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/50 shadow-sm flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all text-slate-600"
          />
        </div>

        {/* Image Count Indicator */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] text-white font-semibold">
           <Camera className="w-3 h-3" />
           <span>{listing.images.length}</span>
        </div>
      </div>

      {/* Bottom Section: Info & Price */}
      <div className="flex flex-col p-4 flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h2 className="text-[17px] font-bold text-foreground leading-tight tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
            {listing.brand} {listing.model}
          </h2>
          {isHighTrust && (
            <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          )}
        </div>
        
        <p className="text-[11px] text-muted-foreground line-clamp-1 mb-3 font-medium uppercase tracking-tighter italic">
          {listing.seller?.userType === "professional" 
            ? (listing.seller.businessName || listing.seller.fullName)
            : listing.title}
        </p>

        {/* High-Scannable Specs Group */}
        <div className="grid grid-cols-2 gap-y-2 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{listing.year}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <Gauge className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatNumber(listing.mileage)} km</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{listing.city}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium font-outfit uppercase">
             {listing.transmission?.substring(0, 3)} / {listing.fuelType?.substring(0, 3)}
          </div>
        </div>

        {/* Price & CTA Section */}
        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-[20px] font-black text-foreground tracking-tighter">
                ₺{formatPrice(listing.price)}
              </span>
            </div>
          </div>
          
          <div className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
             <Clock className="w-3 h-3" />
             Yeni
          </div>
        </div>
      </div>
    </Link>
  )
}
