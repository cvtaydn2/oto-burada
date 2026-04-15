"use client"

import { MapPin, Sparkles } from "lucide-react"
import { type Listing } from "@/types"
import { Badge } from "@/components/ui/badge"

interface ListingHeaderProps {
  listing: Listing
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 0,
  }).format(price)
}

export function ListingHeader({ listing }: ListingHeaderProps) {
  const isAdvantageous = (listing.marketPriceIndex ?? 1) < 0.95

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        {/* Title Section */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {listing.brand} <span className="font-medium text-slate-500">{listing.model}</span>
            </h1>
            {listing.featured && (
              <Badge className="bg-amber-500 text-white text-xs font-medium">
                <Sparkles className="w-3 h-3 mr-1" />
                Öne Çıkan
              </Badge>
            )}
            {isAdvantageous && (
              <Badge className="bg-emerald-500 text-white text-xs font-medium">
                Avantajlı Fiyat
              </Badge>
            )}
          </div>
          <p className="text-base text-slate-600">{listing.title}</p>
          
          {/* Location */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-600">
              {listing.city} / {listing.district}
            </span>
          </div>
        </div>

        {/* Price Section */}
        <div className="lg:text-right">
          <div className="text-3xl font-bold text-blue-600">
            {formatPrice(listing.price)}
            <span className="text-lg font-semibold text-slate-400 ml-1">TL</span>
          </div>
        </div>
      </div>
    </div>
  )
}