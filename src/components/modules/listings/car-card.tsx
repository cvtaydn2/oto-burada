"use client"

import Image from "next/image"
import Link from "next/link"
import { CarFront, Calendar, Gauge, MapPin, Settings2 } from "lucide-react"
import { cn, formatNumber } from "@/lib/utils"
import { type Listing } from "@/types"
import { FavoriteButton } from "@/components/listings/favorite-button"

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
  const detailHref = `/listing/${listing.slug}`

  return (
    <Link 
      href={detailHref}
      className={cn(
        "group relative block overflow-hidden rounded-lg border border-slate-200 bg-white transition-all duration-300 hover:shadow-md",
        variant === "list" && "hover:border-slate-300"
      )}
    >
      <div className={cn("flex", variant === "grid" ? "flex-col" : "flex-col sm:flex-row")}>
        <div className={cn(
          "relative overflow-hidden bg-slate-100",
          variant === "grid" ? "aspect-[16/10]" : "aspect-[16/10] w-full shrink-0 sm:w-[300px] sm:aspect-square"
        )}>
          {coverImage ? (
            <Image
              src={coverImage.url}
              alt={listing.title}
              fill
              sizes={variant === "grid" ? "(min-width: 1024px) 33vw, 50vw" : "320px"}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority={priority}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground/30">
              <CarFront size={48} className="stroke-[1]" />
            </div>
          )}

          <div className="absolute left-3 top-3 z-20 flex flex-col gap-2">
            {listing.featured && (
              <div className="rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-white">
                 Yeni İlan
              </div>
            )}
          </div>

          <div className="absolute right-3 top-3 z-20">
            <FavoriteButton 
              listingId={listing.id}
              className="flex size-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow transition-all hover:bg-white hover:text-primary"
            />
          </div>
        </div>

        <div className={cn("flex flex-1 flex-col p-4", variant === "list" && "justify-center sm:p-5")}>
           <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                 <div className="flex-1 min-w-0">
                     <h3 className={cn(
                       "line-clamp-2 font-bold leading-tight text-slate-900 transition-colors group-hover:text-primary",
                       variant === "grid" ? "text-base" : "text-lg md:text-xl"
                     )}>
                      {listing.title}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                      {listing.year} • {listing.brand} {listing.model}
                    </p>
                 </div>
                 <div className="flex flex-col items-start sm:items-end shrink-0">
                    <div className={cn(
                      "font-bold text-primary",
                      variant === "grid" ? "text-xl" : "text-2xl"
                    )}>
                       ₺{formatPrice(listing.price)}
                    </div>
                 </div>
              </div>

               <div className={cn(
                 "flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-3",
                 variant === "list" && "my-2"
               )}>
                  <SpecItem icon={<Calendar size={13} />} label="Yıl" value={listing.year} />
                  <SpecItem icon={<Gauge size={13} />} label="Km" value={formatNumber(listing.mileage)} />
                  <SpecItem icon={<Settings2 size={13} />} label="Vites" value={listing.transmission === "otomatik" ? "Otomatik" : listing.transmission === "manuel" ? "Manuel" : "Yarı Otomatik"} />
                  <SpecItem icon={<MapPin size={13} />} label="Şehir" value={listing.city} />
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
       <div className="flex size-6 shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-400">
          {icon}
       </div>
       <div className="flex flex-col">
          <span className="text-[10px] font-medium text-slate-400 leading-none mb-0.5">{label}</span>
          <span className={cn("text-xs font-semibold text-slate-700", className)}>
             {value}
          </span>
       </div>
    </div>
  )
}
