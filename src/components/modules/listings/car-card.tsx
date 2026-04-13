"use client"

import Image from "next/image"
import Link from "next/link"
import { CarFront, MapPin, Settings2 } from "lucide-react"
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
    <div 
      className={cn(
        "group relative block overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:shadow-lg",
        variant === "grid" ? "flex-col" : "flex flex-row"
      )}
    >
      <div className={cn(
        "relative bg-gray-100",
        variant === "grid" ? "aspect-[16/10]" : "aspect-[16/10] w-[260px] shrink-0"
      )}>
        <Link href={detailHref} className="block w-full h-full">
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
            <div className="flex items-center justify-center h-full text-gray-300">
              <CarFront size={48} className="stroke-[1]" />
            </div>
          )}
        </Link>
        
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
          {listing.hasExpertReport && (
            <div className="rounded bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              Ekspertizli
            </div>
          )}
          {listing.featured && !listing.hasExpertReport && (
            <div className="rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              Öne Çıkan
            </div>
          )}
        </div>

        <div className="absolute right-3 top-3 z-10">
          <FavoriteButton 
            listingId={listing.id}
            className="flex size-8 items-center justify-center rounded-full bg-white/80 text-gray-500 shadow-sm transition-all hover:bg-white hover:text-red-500 backdrop-blur-sm"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Link href={detailHref} className="group-hover:text-primary transition-colors">
          <h3 className="font-bold text-lg text-gray-800 truncate leading-tight">
            {listing.title}
          </h3>
          <p className="mt-1 text-sm text-gray-500 font-medium">{listing.year}</p>
        </Link>

        <div className="mt-3 flex items-center justify-between border-b border-gray-100 pb-3 text-[11px] font-medium text-gray-500">
          <span className="flex items-center gap-1.5 capitalize">
            <Settings2 size={13} className="text-gray-400" />
            {listing.transmission === "yari_otomatik" ? "Yarı Otomatik" : listing.transmission}
          </span>
          <span className="flex items-center gap-1.5 capitalize">
            <CarFront size={13} className="text-gray-400" />
            {listing.fuelType}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <p className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
            <MapPin size={12} className="text-gray-300" />
            {listing.city}, {listing.district}
          </p>
          <div className="text-xl font-extrabold text-primary">
            ₺{formatPrice(listing.price)}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-3">
          <span className="text-xs font-bold text-gray-500">{formatNumber(listing.mileage)} km</span>
          <Link 
            href={detailHref} 
            className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
          >
            İncele
            <svg className="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
