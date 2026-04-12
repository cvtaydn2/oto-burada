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
  const isHighTrust = (listing.fraudScore ?? 0) < 10
  const isUrgent = listing.urgentUntil ? new Date(listing.urgentUntil) > new Date() : false
  const detailHref = `/listing/${listing.slug}`

  return (
    <Link 
      href={detailHref}
      className={cn(
        "group relative block bg-card rounded-[32px] border border-border/40 overflow-hidden transition-all duration-500",
        variant === "grid" ? "showroom-card" : "card-shadow hover:shadow-2xl"
      )}
    >
      <div className={cn("flex", variant === "grid" ? "flex-col" : "flex-col sm:flex-row")}>
        {/* Media Frame */}
        <div className={cn(
          "relative overflow-hidden bg-secondary/30",
          variant === "grid" ? "aspect-[4/3]" : "w-full sm:w-[320px] aspect-[16/10] sm:aspect-square shrink-0"
        )}>
          {coverImage ? (
            <Image
              src={coverImage.url}
              alt={listing.title}
              fill
              sizes={variant === "grid" ? "(min-width: 1024px) 33vw, 50vw" : "320px"}
              className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
              priority={priority}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground/30">
              <CarFront size={48} className="stroke-[1]" />
            </div>
          )}

          {/* Elite Badges Overlay */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
            {listing.featured && (
              <div className="glass px-3 py-1.5 rounded-2xl flex items-center gap-1.5 text-[9px] font-black tracking-widest text-primary uppercase shadow-lg">
                <Sparkles size={12} className="fill-primary" />
                VİTRİN
              </div>
            )}
            {isUrgent && (
              <div className="bg-accent px-3 py-1.5 rounded-2xl flex items-center gap-1.5 text-[9px] font-black tracking-widest text-white uppercase shadow-lg shadow-accent/20">
                <Zap size={12} className="fill-white" />
                ACİL
              </div>
            )}
          </div>

          <div className="absolute top-4 right-4 z-20">
            <FavoriteButton 
              listingId={listing.id}
              className="size-10 rounded-full glass flex items-center justify-center text-foreground hover:bg-white hover:text-primary transition-all shadow-xl"
            />
          </div>

          <div className="absolute bottom-4 right-4 z-20 glass px-2 py-1 rounded-lg text-[9px] font-black text-white/80 uppercase">
            {images.length} FOTO
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent group-hover:opacity-0 transition-opacity" />
        </div>

        {/* Content Section */}
        <div className={cn("flex-1 p-6 flex flex-col", variant === "list" && "sm:p-8 justify-center")}>
           <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                 <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1 italic">
                      {listing.brand}
                    </div>
                    <h3 className={cn(
                      "font-black text-foreground tracking-tightest leading-tight uppercase italic group-hover:text-primary transition-colors",
                      variant === "grid" ? "text-xl" : "text-2xl md:text-3xl"
                    )}>
                      {listing.model}
                    </h3>
                    <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1.5 line-clamp-1 italic">
                      {listing.title}
                    </p>
                 </div>
                 <div className="flex flex-col items-start sm:items-end shrink-0">
                    <div className={cn(
                      "font-black text-primary tracking-tightest italic",
                      variant === "grid" ? "text-2xl" : "text-3xl md:text-4xl"
                    )}>
                      ₺{formatPrice(listing.price)}
                    </div>
                    {isAdvantageous && (
                      <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em] mt-1 italic">Fırsat İlanı</span>
                    )}
                 </div>
              </div>

              {/* Technical Ribbon */}
              <div className={cn(
                "flex flex-wrap gap-x-6 gap-y-3 pt-6 border-t border-border/40",
                variant === "list" && "my-6"
              )}>
                 <SpecItem icon={<Calendar size={14} />} label="YIL" value={listing.year} />
                 <SpecItem icon={<Gauge size={14} />} label="MESAFE" value={`${formatNumber(listing.mileage)} km`} />
                 <SpecItem icon={<Settings2 size={14} />} label="VİTES" value={listing.transmission?.slice(0, 3)} className="uppercase" />
                 <SpecItem icon={<MapPin size={14} />} label="LOKASYON" value={listing.city} className="uppercase" />
              </div>

              {/* Verification & Trust */}
              <div className="flex items-center justify-between pt-4">
                 <div className="flex items-center gap-4">
                    {isHighTrust && (
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                        <ShieldCheck size={14} />
                        DOĞRULANMIŞ
                      </div>
                    )}
                    <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest italic">
                      {isUrgent ? "ÖNCELİKLİ ÜYE" : "GÜNCEL İLAN"}
                    </div>
                 </div>
                 <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all group-hover:gap-3 italic">
                    İNCELE <ChevronRight size={14} />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </Link>
  )
}

function SpecItem({ icon, label, value, className }: { icon: React.ReactNode, label: string, value: string | number, className?: string }) {
  return (
    <div className="flex items-center gap-2">
       <div className="size-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shrink-0 border border-border/20">
          {icon}
       </div>
       <div className="flex flex-col">
          <span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest leading-none mb-0.5">{label}</span>
          <span className={cn("text-xs font-black text-foreground tracking-tight", className)}>
             {value}
          </span>
       </div>
    </div>
  )
}
