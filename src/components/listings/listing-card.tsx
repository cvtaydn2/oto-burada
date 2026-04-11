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
  TrendingDown
} from "lucide-react"
import { formatNumber } from "@/lib/utils"
import { type Listing } from "@/types"
import { Badge } from "@/components/ui/badge"

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
      className="group block bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all duration-200"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image Section */}
        <div className="relative w-full sm:w-[240px] aspect-[4/3] sm:aspect-auto shrink-0 bg-slate-100">
          {coverImage ? (
            <Image
              src={coverImage.url}
              alt={listing.title}
              fill
              sizes="(min-width: 640px) 240px, 100vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              priority={priority}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <span className="text-sm">Görsel yok</span>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {listing.featured && (
              <Badge className="bg-amber-500 text-white text-xs font-medium px-2 py-0.5">
                <Sparkles className="w-3 h-3 mr-1" />
                Vitrin
              </Badge>
            )}
            {isAdvantageous && (
              <Badge className="bg-emerald-500 text-white text-xs font-medium px-2 py-0.5">
                <TrendingDown className="w-3 h-3 mr-1" />
                Avantajlı
              </Badge>
            )}
          </div>

          {/* Image Count */}
          <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 rounded text-xs text-white font-medium">
            {listing.images.length} fotoğraf
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-4 min-w-0 flex flex-col justify-between">
          <div className="space-y-2">
            {/* Title & Price */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                  {listing.brand} {listing.model}
                </h3>
                <p className="text-sm text-slate-500 truncate">{listing.title}</p>
              </div>
              <div className="shrink-0 text-left sm:text-right">
                <span className="text-xl font-bold text-blue-600">
                  {formatPrice(listing.price)}
                </span>
                <span className="text-xs text-slate-400 ml-1">TL</span>
              </div>
            </div>

            {/* Specs - Compact Grid */}
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-medium">{listing.year}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <CircleGauge className="w-4 h-4 text-slate-400" />
                <span className="font-medium">{formatNumber(listing.mileage)} km</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Fuel className="w-4 h-4 text-slate-400" />
                <span className="font-medium">{listing.fuelType}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Settings2 className="w-4 h-4 text-slate-400" />
                <span className="font-medium">{listing.transmission}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span>{listing.city}</span>
            </div>
            <span className="text-sm text-slate-400 font-medium">
              Detay &rarr;
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}