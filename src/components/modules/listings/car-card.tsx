"use client"

import Image from "next/image"
import Link from "next/link"
import { CarFront, Calendar, Gauge, MapPin, Sparkles, TrendingDown, Clock, ShieldCheck, Camera, Zap, ChevronRight } from "lucide-react"
import { cn, formatNumber } from "@/lib/utils"
import { type Listing } from "@/types"
import { Badge } from "@/components/ui/badge"
import { FavoriteButton } from "@/components/listings/favorite-button"
import { Settings2 } from "lucide-react"

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
  const images = Array.isArray(listing.images) ? listing.images : []
  const coverImage = images.find(img => img.isCover) || images[0]
  
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
        className="group relative flex flex-col sm:flex-row bg-card rounded-3xl border border-border overflow-hidden hover:ring-2 hover:ring-primary/20 hover:shadow-2xl transition-all duration-500 bg-white"
      >
        {/* Horizontal Card: Image Section */}
        <div className="relative w-full sm:w-[320px] aspect-[16/10] sm:aspect-square shrink-0 overflow-hidden bg-slate-100">
          {coverImage ? (
            <Image
              src={coverImage.url}
              alt={`${listing.brand} ${listing.model}`}
              fill
              sizes="(min-width: 640px) 320px, 100vw"
              className="object-cover group-hover:scale-110 transition-transform duration-700"
              priority={priority}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
              <CarFront size={48} strokeWidth={1} />
              <span className="text-xs font-bold uppercase tracking-widest italic">Görsel Yok</span>
            </div>
          )}
          
          {/* Quality Overlays for List View */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {listing.featured && (
              <Badge className="bg-amber-500 text-white border-none shadow-lg px-2.5 py-1 font-black italic text-[10px] uppercase tracking-tighter">
                <Sparkles size={12} className="mr-1 fill-current" />
                Vitrin
              </Badge>
            )}
            {isAdvantageous && (
              <Badge className="bg-emerald-500 text-white border-none shadow-lg px-2.5 py-1 font-black italic text-[10px] uppercase tracking-tighter">
                <TrendingDown size={12} className="mr-1" />
                Fırsat
              </Badge>
            )}
          </div>

          <div className="absolute top-4 right-4 z-20">
            <FavoriteButton
              listingId={listing.id}
              className="size-10 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all text-slate-600"
            />
          </div>

          <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] text-white font-black italic">
             <Camera size={12} />
             <span>{images.length}</span>
          </div>
        </div>

        {/* Horizontal Card: Content Section */}
        <div className="flex-1 flex flex-col p-6 sm:p-8 min-w-0">
           <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div className="space-y-1">
                 <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black tracking-tight text-foreground italic group-hover:text-primary transition-colors">
                       {listing.brand} {listing.model}
                       {listing.carTrim && <span className="ml-2 font-medium text-slate-400 not-italic text-lg">{listing.carTrim}</span>}
                    </h2>
                    {isHighTrust && <ShieldCheck className="text-emerald-500" size={20} />}
                 </div>
                 <p className="text-sm font-medium text-muted-foreground italic line-clamp-1 max-w-md">
                    {listing.title}
                 </p>
              </div>

              <div className="flex flex-col sm:items-end">
                 <div className="text-3xl font-black text-foreground tracking-tighter">
                    ₺{formatPrice(listing.price)}
                 </div>
                 {isFairPrice && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-1 italic">
                       Piyasa Değerinde
                    </span>
                 )}
              </div>
           </div>

           {/* Technical Grid (Spacious in List view) */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 py-6 border-y border-slate-100 mb-6">
              <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic flex items-center gap-1.5">
                    <Calendar size={12} /> Model
                 </span>
                 <span className="text-sm font-black text-slate-700">{listing.year}</span>
              </div>
              <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic flex items-center gap-1.5">
                    <Gauge size={12} /> Kilometre
                 </span>
                 <span className="text-sm font-black text-slate-700">{formatNumber(listing.mileage)} km</span>
              </div>
              <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic flex items-center gap-1.5">
                    <Settings2 size={12} className="hidden sm:inline" /> Vites
                 </span>
                 <span className="text-sm font-black text-slate-700 capitalize">{listing.transmission}</span>
              </div>
              <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic flex items-center gap-1.5">
                    <MapPin size={12} /> Şehir
                 </span>
                 <span className="text-sm font-black text-slate-700 truncate">{listing.city}</span>
              </div>
           </div>

           <div className="mt-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <Badge variant="outline" className="border-slate-200 text-slate-500 font-bold text-[10px] uppercase px-2">
                    {listing.fuelType}
                 </Badge>
                 <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-black italic">
                    <Clock size={12} />
                    {listing.urgentUntil ? "Acil İlan" : "Yeni Eklenen"}
                 </div>
              </div>

              <div className="text-primary font-black text-xs flex items-center gap-1 italic uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                 İlanı Gör <ChevronRight size={14} />
              </div>
           </div>
        </div>
      </Link>
    )
  }

  return (
    <Link 
      href={`/listing/${listing.slug}`}
      className="group relative flex flex-col bg-card rounded-3xl border border-border overflow-hidden card-shadow transition-all duration-500 bg-white"
    >
      {/* Top Section: Visuals & Badges */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-50">
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={`${listing.brand} ${listing.model} ${listing.year}`}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
            <CarFront size={40} strokeWidth={1} />
            <span className="text-[10px] font-bold uppercase tracking-widest italic">Görsel Yok</span>
          </div>
        )}
        
        {/* Modern Badges Layer */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {listing.featured && (
            <Badge className="bg-amber-500 text-white border-none shadow-lg px-2 py-1 font-black italic text-[9px] uppercase tracking-tighter">
              <Sparkles className="w-3 h-3 mr-1 fill-current" />
              Vitrin
            </Badge>
          )}
          {isUrgent && (
            <Badge className="bg-red-600 text-white border-none shadow-lg px-2 py-1 font-black italic text-[9px] uppercase tracking-tighter animate-pulse">
              <Zap className="w-3 h-3 mr-1 fill-current" />
              ACİL
            </Badge>
          )}
          {isAdvantageous && (
            <Badge className="bg-emerald-500 text-white border-none shadow-lg px-2 py-1 font-black italic text-[9px] uppercase tracking-tighter">
              <TrendingDown className="w-3 h-3 mr-1" />
              Fırsat
            </Badge>
          )}
        </div>

        {/* Favorite & Interaction Overlay */}
        <div className="absolute top-4 right-4 z-20">
          <FavoriteButton
            listingId={listing.id}
            className="size-9 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-md flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all text-slate-600"
          />
        </div>

        {/* Image Count Indicator */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[10px] text-white font-black italic">
           <Camera size={12} />
           <span>{images.length}</span>
        </div>
      </div>

      {/* Bottom Section: Info & Price */}
      <div className="flex flex-col p-5 flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h2 className="text-lg font-black text-foreground leading-tight tracking-tight line-clamp-1 group-hover:text-primary transition-colors italic">
            {listing.brand} {listing.model}
            {listing.carTrim && <span className="ml-2 font-bold text-slate-400 not-italic text-sm">{listing.carTrim}</span>}
          </h2>
          {isHighTrust && (
            <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          )}
        </div>
        
        <p className="text-[10px] text-muted-foreground line-clamp-1 mb-4 font-bold uppercase tracking-tighter italic">
           {listing.title}
        </p>

        {/* High-Scannable Specs Group */}
        <div className="grid grid-cols-2 gap-y-3 mb-6">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-black italic">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{listing.year}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-black italic">
            <Gauge className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatNumber(listing.mileage)} km</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-black italic">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{listing.city}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-black italic uppercase tracking-tighter">
             <Settings2 size={13} className="text-slate-400" />
             {listing.transmission?.substring(0, 3)} / {listing.fuelType?.substring(0, 3)}
          </div>
        </div>

        {/* Price & CTA Section */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
              <span className="text-xl font-black text-foreground tracking-tighter">
                ₺{formatPrice(listing.price)}
              </span>
          </div>
          
          <div className="text-[10px] font-black text-muted-foreground flex items-center gap-1 italic uppercase tracking-widest">
             <Clock className="w-3 h-3" />
             Yeni
          </div>
        </div>
      </div>
    </Link>
  )
}
