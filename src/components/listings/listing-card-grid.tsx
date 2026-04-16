"use client"

import Image from "next/image"
import Link from "next/link"
import { CarFront, Sparkles, TrendingDown } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import { type Listing } from "@/types"
import { Badge } from "@/components/ui/badge"
import { FavoriteButton } from "@/components/listings/favorite-button"

interface ListingCardGridProps {
  listing: Listing
  priority?: boolean
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 0,
  }).format(price)
}

export function ListingCardGrid({ listing, priority = false }: ListingCardGridProps) {
  const coverImage = listing.images.find(img => img.isCover) || listing.images[0]
  const isAdvantageous = (listing.marketPriceIndex ?? 1) < 0.95

  return (
    <Link 
      href={`/listing/${listing.slug}`}
      className="group relative flex flex-col bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-md transition-all duration-200"
    >
      {/* Image */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted">
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={listing.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
            <CarFront className="w-8 h-8" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {listing.featured && (
            <Badge className="bg-amber-500 text-white text-[10px] font-medium px-1.5 py-0.5">
              <Sparkles className="w-2.5 h-2.5 mr-1" />
              Vitrin
            </Badge>
          )}
          {isAdvantageous && (
            <Badge className="bg-emerald-500 text-white text-[10px] font-medium px-1.5 py-0.5">
              <TrendingDown className="w-2.5 h-2.5 mr-1" />
              Avantajlı
            </Badge>
          )}
        </div>

        {/* Image Count */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white font-medium">
          {listing.images.length}
        </div>

        {/* Favorite Button */}
        <div className="absolute top-2 right-2">
          <FavoriteButton
            listingId={listing.id}
            className="size-8 rounded-full bg-background shadow-md flex items-center justify-center hover:scale-110 transition-transform"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col p-3 space-y-2">
        <h2 className="text-sm font-semibold text-card-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {listing.brand} {listing.model}
        </h2>
        
        <p className="text-xs text-muted-foreground line-clamp-1">{listing.title}</p>

        {/* Specs */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="bg-muted px-1.5 py-0.5 rounded font-medium">{listing.year}</span>
          <span className="bg-muted px-1.5 py-0.5 rounded font-medium">{formatNumber(listing.mileage)} km</span>
        </div>

        {/* Price */}
        <div className="mt-auto pt-1 flex items-end justify-between">
          <span className="text-base font-bold text-primary">
            {formatPrice(listing.price)}
            <span className="text-[10px] text-muted-foreground ml-0.5">TL</span>
          </span>
          <span className="text-[10px] text-muted-foreground">{listing.city}</span>
        </div>
      </div>
    </Link>
  )
}