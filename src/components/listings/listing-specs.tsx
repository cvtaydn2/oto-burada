"use client"

import { CalendarDays, CircleGauge, Fuel, Settings2 } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import { type Listing } from "@/types"
import { Badge } from "@/components/ui/badge"

interface ListingSpecsProps {
  listing: Listing
}

export function ListingSpecs({ listing }: ListingSpecsProps) {
  const specs = [
    { label: "Yıl", value: listing.year, icon: CalendarDays },
    { label: "KM", value: `${formatNumber(listing.mileage)} km`, icon: CircleGauge },
    { label: "Yakıt", value: listing.fuelType, icon: Fuel },
    { label: "Vites", value: listing.transmission, icon: Settings2 },
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {specs.map((spec) => (
        <div
          key={spec.label}
          className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 bg-white"
        >
          <spec.icon className="w-5 h-5 text-blue-600 mb-1" />
          <span className="text-[10px] font-medium text-slate-500 uppercase">{spec.label}</span>
          <span className="text-sm font-semibold text-slate-900">{spec.value}</span>
        </div>
      ))}
    </div>
  )
}