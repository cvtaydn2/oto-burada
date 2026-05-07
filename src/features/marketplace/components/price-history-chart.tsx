"use client";

import { Minus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui/components/card";

interface PriceHistoryChartProps {
  listingId: string;
  currentPrice: number;
}

/**
 * Lean version of PriceHistoryChart without recharts dependency.
 * Standardizes bundle size for MVP.
 */
export function PriceHistoryChart({ currentPrice }: PriceHistoryChartProps) {
  return (
    <Card className="overflow-hidden border-none bg-muted/30 shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Fiyat Analizi
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Minus className="h-3.5 w-3.5" />
              Stabil Trend
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex h-[200px] w-full flex-col items-center justify-center text-center">
          <div className="text-sm font-medium text-foreground/80 mb-1">
            Fiyat geçmişi yakında burada.
          </div>
          <div className="text-xs text-muted-foreground">
            Sistem bu ilanın fiyat değişimlerini takip etmeye başladı.
          </div>
          {currentPrice > 0 && (
            <div className="mt-4 text-[10px] font-bold text-primary/60 uppercase tracking-tighter">
              Takip Edilen Fiyat:{" "}
              {new Intl.NumberFormat("tr-TR", {
                style: "currency",
                currency: "TRY",
                maximumFractionDigits: 0,
              }).format(currentPrice)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
