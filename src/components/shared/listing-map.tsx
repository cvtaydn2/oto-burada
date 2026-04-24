"use client";

import { MapPin } from "lucide-react";

interface ListingMapProps {
  city: string;
  district: string;
  className?: string;
}

/**
 * Lean version of ListingMap without leaflet dependency.
 * Uses a styled placeholder for MVP to keep bundle small.
 */
export function ListingMap({ city, district, className = "" }: ListingMapProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border bg-muted/20 ${className}`}
      style={{ minHeight: 240 }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-mesh opacity-30" />
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center p-6 text-center">
        <div className="mb-3 rounded-full bg-primary/10 p-3 text-primary ring-8 ring-primary/5">
          <MapPin size={24} />
        </div>
        <div className="text-sm font-bold text-foreground mb-1">
          {city}, {district}
        </div>
        <div className="text-xs text-muted-foreground max-w-[200px]">
          İlan konumu yaklaşık olarak işaretlenmiştir.
        </div>
      </div>

      {/* Bottom label */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded-lg bg-card/90 backdrop-blur-sm px-3 py-1.5 shadow-sm border border-border">
        <MapPin size={13} className="text-primary" />
        <span className="text-xs font-bold text-foreground">
          {city}
          {district ? `, ${district}` : ""}
        </span>
      </div>
    </div>
  );
}
