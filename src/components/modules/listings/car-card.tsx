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
  const images = Array.isArray(listing.images) ? listing.images : []
  const coverImage = images.find(img => img.isCover) || images[0]
  
  const isAdvantageous = (listing.marketPriceIndex ?? 1) < 0.95
  const isFairPrice = (listing.marketPriceIndex ?? 1) >= 0.95 && (listing.marketPriceIndex ?? 1) <= 1.05
  const isHighTrust = (listing.fraudScore ?? 0) < 10
  const isUrgent = listing.urgentUntil ? new Date(listing.urgentUntil) > new Date() : false

  if (variant === "list") {
    return (
      <Link 
        href={`/listing/${listing.slug}`}
        className="group relative flex flex-col sm:flex-row bg-white rounded-[32px] overflow-hidden border border-slate-100 card-shadow transition-all duration-500"
      >
        <div className="relative w-full sm:w-[280px] aspect-[16/10] sm:aspect-square overflow-hidden bg-slate-50">
          {coverImage ? (
            <Image
              src={coverImage.url}
              alt={`${listing.brand} ${listing.model}`}
              fill
              sizes="(min-width: 640px) 280px, 100vw"
              className="object-cover group-hover:scale-105 transition-transform duration-1000"
              priority={priority}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-200">
              <CarFront size={48} strokeWidth={1} />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {listing.featured && (
              <Badge className="bg-amber-400 text-amber-950 border-none shadow-sm px-2.5 py-1 font-black text-[10px] uppercase tracking-wider">
                <Sparkles size={12} className="mr-1 fill-amber-950" />
                VİTRİN
              </Badge>
            )}
            {isAdvantageous && (
              <Badge className="bg-emerald-500 text-white border-none shadow-sm px-2.5 py-1 font-black text-[10px] uppercase tracking-wider">
                <TrendingDown size={12} className="mr-1" />
                FIRSAT
              </Badge>
            )}
          </div>

          <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <FavoriteButton
              listingId={listing.id}
              className="size-9 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-slate-600"
            />
          </div>
        </div>

        <div className="flex-1 p-6 sm:p-8 flex flex-col min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
             <div className="space-y-1">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-primary transition-colors duration-300 font-heading leading-tight">
                   {listing.brand} <span className="text-slate-400 font-medium">{listing.model}</span>
                </h2>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed line-clamp-1">{listing.title}</p>
             </div>
             <div className="flex flex-col sm:items-end">
                <div className="text-3xl font-black text-slate-900 tracking-tighter font-heading leading-none">
                   ₺{formatPrice(listing.price)}
                </div>
                {isFairPrice && (
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 italic uppercase tracking-tighter border border-emerald-100">
                    Piyasa Değerinde
                  </span>
                )}
             </div>
          </div>

          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-6 my-8 py-6 border-y border-slate-50">
             <SpecItem icon={<Calendar size={14} />} label="Model" value={listing.year} />
             <SpecItem icon={<Gauge size={14} />} label="KM" value={`${formatNumber(listing.mileage)} km`} />
             <SpecItem icon={<Settings2 size={14} />} label="Vites" value={listing.transmission} className="capitalize" />
             <SpecItem icon={<MapPin size={14} />} label="Şehir" value={listing.city} />
          </div>

          <div className="flex items-center justify-between mt-auto">
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   <Clock size={12} />
                   {isUrgent ? "ACİL" : "YENİ"}
                </div>
                {isHighTrust && (
                  <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                    <ShieldCheck size={14} />
                    GÜVENLİ
                  </div>
                )}
             </div>
             <div className="text-primary font-black text-[11px] uppercase tracking-widest flex items-center gap-2 group/btn">
                DETAYLARI GÖR 
                <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
             </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link 
      href={`/listing/${listing.slug}`}
      className="group relative flex flex-col bg-white rounded-[40px] border border-slate-100 card-shadow transition-all duration-700 h-full overflow-hidden"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={`${listing.brand} ${listing.model}`}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-200">
            <CarFront size={48} strokeWidth={1} />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col justify-end p-6">
           <div className="flex flex-col gap-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-700 delay-75">
              <div className="text-3xl font-black text-white tracking-tighter font-heading border-b border-white/20 pb-2 mb-2">
                ₺{formatPrice(listing.price)}
              </div>
              <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em] italic">
                 HEMEN İNCELE <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
           </div>
        </div>
        
        <div className="absolute top-5 left-5 flex flex-col gap-2 z-20">
           {listing.featured && (
             <div className="glass px-3 py-1.5 rounded-2xl flex items-center gap-1.5 text-[10px] font-black tracking-widest text-amber-500 uppercase">
                <Sparkles size={12} className="fill-amber-500 text-amber-500" />
                VİTRİN
             </div>
           )}
           {isUrgent && (
             <div className="bg-red-500 px-3 py-1.5 rounded-2xl flex items-center gap-1.5 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-red-500/20">
                <Zap size={12} className="fill-white" />
                ACİL
             </div>
           )}
        </div>

        <div className="absolute top-5 right-5 z-20">
           <FavoriteButton 
             listingId={listing.id}
             className="size-10 rounded-full glass flex items-center justify-center text-slate-700 hover:scale-110 active:scale-95 transition-all shadow-xl group-hover:bg-white/10 group-hover:text-white"
           />
        </div>

        {/* Static Price (Hidden on Hover) */}
        <div className="absolute bottom-5 left-5 transition-opacity duration-300 group-hover:opacity-0">
           <div className="text-2xl font-black text-white tracking-tighter drop-shadow-md font-heading">
             ₺{formatPrice(listing.price)}
           </div>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
           <h3 className="text-lg font-black tracking-tight text-slate-900 group-hover:text-primary transition-colors duration-300 font-heading">
             {listing.brand} <span className="text-slate-400 font-bold">{listing.model}</span>
           </h3>
           {isHighTrust && <ShieldCheck className="text-emerald-500 shrink-0" size={20} />}
        </div>
        
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 line-clamp-1 italic">{listing.title}</p>

        <div className="grid grid-cols-2 gap-4 mt-auto pt-6 border-t border-slate-50">
           <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
              <Calendar size={14} className="text-slate-400" />
              {listing.year}
           </div>
           <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
              <Gauge size={14} className="text-slate-400" />
              {formatNumber(listing.mileage)} km
           </div>
           <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
              <Settings2 size={14} className="text-slate-400" />
              <span className="truncate capitalize">{listing.transmission?.substring(0, 3)}</span>
           </div>
           <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
              <MapPin size={14} className="text-slate-400" />
              <span className="truncate">{listing.city}</span>
           </div>
        </div>
      </div>
    </Link>
  )
}

function SpecItem({ icon, label, value, className }: { icon: React.ReactNode, label: string, value: string | number, className?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
       <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
          {icon}
          {label}
       </div>
       <div className={cn("text-sm font-black text-slate-700 font-heading", className)}>
          {value}
       </div>
    </div>
  )
}
