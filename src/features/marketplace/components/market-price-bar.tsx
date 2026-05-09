"use client";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";

interface MarketPriceBarProps {
  currentPrice: number;
  averagePrice: number;
  className?: string;
}

export function MarketPriceBar({ currentPrice, averagePrice, className }: MarketPriceBarProps) {
  // We'll show a range from 80% to 120% of average
  const minRange = averagePrice * 0.8;
  const maxRange = averagePrice * 1.2;

  // Calculate percentage position (0 to 100)
  const position = ((currentPrice - minRange) / (maxRange - minRange)) * 100;
  const safePosition = Math.min(Math.max(position, 5), 95); // Keep within bounds for UI

  const diffPercent = ((currentPrice - averagePrice) / averagePrice) * 100;
  const isGoodPrice = currentPrice < averagePrice * 0.95;
  const isHighPrice = currentPrice > averagePrice * 1.05;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-end text-xs font-bold uppercase tracking-wider">
        <span className="text-emerald-600">Fırsat</span>
        <span className="text-muted-foreground/70">Piyasa Ortalaması</span>
        <span className="text-amber-600">Yüksek</span>
      </div>

      <div className="relative h-3 w-full rounded-full bg-muted overflow-visible">
        {/* Gradient Track */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 via-slate-300 to-amber-500 opacity-30" />

        {/* Market Average Marker */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-1 bg-slate-400 rounded-full z-10" />

        {/* Current Price Pointer */}
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-out z-20"
          style={{ left: `${safePosition}%` }}
        >
          <div
            className={cn(
              "relative size-5 rounded-full border-4 border-white shadow-sm",
              isGoodPrice ? "bg-emerald-500" : isHighPrice ? "bg-amber-500" : "bg-indigo-500"
            )}
          >
            {/* Label below pointer */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 whitespace-nowrap">
              <span
                className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm",
                  isGoodPrice
                    ? "bg-emerald-600 text-white"
                    : isHighPrice
                      ? "bg-amber-600 text-white"
                      : "bg-slate-800 text-white"
                )}
              >
                BU İLAN
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 flex justify-between items-center bg-muted/30 rounded-2xl p-4 border border-border/50">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground/70 uppercase">
            Piyasa Ortalaması
          </p>
          <p className="text-sm font-bold text-foreground/90">{formatCurrency(averagePrice)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-muted-foreground/70 uppercase">Durum</p>
          <p
            className={cn(
              "text-sm font-bold",
              isGoodPrice
                ? "text-emerald-600"
                : isHighPrice
                  ? "text-amber-600"
                  : "text-foreground/90"
            )}
          >
            {isGoodPrice
              ? `%${Math.abs(Math.round(diffPercent))} Avantajlı`
              : isHighPrice
                ? `%${Math.round(diffPercent)} Üstünde`
                : "Piyasa Değerinde"}
          </p>
        </div>
      </div>
    </div>
  );
}
