"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { cn, formatPrice } from "@/features/shared/lib";

interface PriceAnalysisWidgetProps {
  currentPrice: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  status: "good" | "fair" | "high" | "unknown";
  className?: string;
}

export function PriceAnalysisWidget({
  currentPrice,
  avgPrice,
  minPrice,
  maxPrice,
  status,
  className,
}: PriceAnalysisWidgetProps) {
  if (status === "unknown") return null;

  // Calculate percentage position on the scale
  // Scale is from minPrice to maxPrice
  // currentPrice position: (currentPrice - minPrice) / (maxPrice - minPrice)
  const range = maxPrice - minPrice;
  const position =
    range > 0 ? Math.min(Math.max(((currentPrice - minPrice) / range) * 100, 0), 100) : 50;

  const avgPosition =
    range > 0 ? Math.min(Math.max(((avgPrice - minPrice) / range) * 100, 0), 100) : 50;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Visual Meter */}
      <div className="relative pt-6 pb-2">
        {/* Scale labels */}
        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
          <span>En Dusuk</span>
          <span>Ortalama</span>
          <span>En Yuksek</span>
        </div>

        {/* The Track */}
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden relative">
          {/* Gradient track */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-blue-400 to-rose-400 opacity-30" />

          {/* Average Marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-foreground/20 z-10"
            style={{ left: `${avgPosition}%` }}
          />
        </div>

        {/* Current Price Pointer */}
        <div
          className="absolute top-8 transition-all duration-1000 ease-out"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        >
          <div className="flex flex-col items-center">
            <div className="size-3 rounded-full bg-primary border-2 border-white shadow-md mb-1" />
            <div className="px-2 py-0.5 bg-primary text-white text-[9px] font-bold rounded-md whitespace-nowrap shadow-sm">
              BU ILAN
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground font-medium mb-0.5">En Dusuk</p>
          <p className="text-xs font-bold">{formatPrice(minPrice)}</p>
        </div>
        <div className="text-center border-x border-border">
          <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Ortalama</p>
          <p className="text-xs font-bold">{formatPrice(avgPrice)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground font-medium mb-0.5">En Yuksek</p>
          <p className="text-xs font-bold">{formatPrice(maxPrice)}</p>
        </div>
      </div>

      {/* Insight Box */}
      <div
        className={cn(
          "p-3 rounded-xl border flex gap-3 items-start",
          status === "good"
            ? "bg-emerald-50 border-emerald-100 text-emerald-800"
            : status === "high"
              ? "bg-rose-50 border-rose-100 text-rose-800"
              : "bg-blue-50 border-blue-100 text-blue-800"
        )}
      >
        {status === "good" ? (
          <TrendingDown size={16} className="shrink-0 mt-0.5" />
        ) : status === "high" ? (
          <TrendingUp size={16} className="shrink-0 mt-0.5" />
        ) : (
          <Minus size={16} className="shrink-0 mt-0.5" />
        )}
        <div>
          <p className="text-xs font-bold">
            {status === "good"
              ? "Firsat Fiyat Avantaji"
              : status === "high"
                ? "Piyasanin Biraz Ustunde"
                : "Piyasa Degerinde"}
          </p>
          <p className="text-[11px] opacity-80 leading-relaxed mt-0.5">
            {status === "good"
              ? "Bu arac benzer ilanlara gore oldukca avantajli bir fiyata sahip."
              : status === "high"
                ? "Aracin donanimi veya temizlik durumu bu fiyat farkini acikliyor olabilir."
                : "Bu ilan piyasadaki benzer araclarla ayni fiyat seviyesinde seyrediyor."}
          </p>
        </div>
      </div>
    </div>
  );
}
