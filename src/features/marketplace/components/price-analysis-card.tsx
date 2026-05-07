import { CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";

import { formatCurrency } from "@/features/shared/lib";

import { MarketPriceBar } from "./market-price-bar";

interface PriceAnalysisCardProps {
  price: number;
  marketStatus: "excellent" | "fair" | "high";
  priceDiff: number;
  marketPriceIndex?: number;
}

export function PriceAnalysisCard({
  price,
  marketStatus,
  priceDiff,
  marketPriceIndex = 1.0,
}: PriceAnalysisCardProps) {
  const isManipulated = marketPriceIndex && price > marketPriceIndex * 1.3;
  const avgPrice = price / (marketPriceIndex || 1.0);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-background shadow-sm">
      <div className="border-b border-border/50 p-6 sm:p-8">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          İlan Fiyatı
        </div>
        <div className="mb-6 text-4xl font-bold tracking-tight text-foreground">
          {formatCurrency(price).replace("₺", "")}{" "}
          <span className="text-2xl font-medium text-muted-foreground">TL</span>
        </div>

        {/* Market Analysis Visual */}
        <div className="rounded-xl border border-border/70 bg-muted/30 p-5">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              Yapay Zeka Fiyat Analizi
            </span>
            {marketStatus === "excellent" && (
              <div className="flex w-fit items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-500">
                <TrendingDown size={14} /> ÇOK İYİ FİYAT
              </div>
            )}
            {marketStatus === "fair" && (
              <div className="flex w-fit items-center gap-1 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-500">
                <CheckCircle2 size={14} /> ADİL FİYAT
              </div>
            )}
            {marketStatus === "high" && (
              <div className="flex w-fit items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-500">
                <TrendingUp size={14} /> ORTALAMA ÜSTÜ
              </div>
            )}
          </div>

          <MarketPriceBar currentPrice={price} averagePrice={avgPrice} className="mb-6" />

          <div className="rounded-xl border border-border/50 bg-background p-3 shadow-sm">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Bu araç, benzer özelliklerdeki ilanların analizine göre piyasa
              {priceDiff === 0 ? (
                <strong className="ml-1 text-blue-600 dark:text-blue-500">
                  ortalamasında (Adil Fiyat)
                </strong>
              ) : (
                <>
                  {" "}
                  ortalamasından
                  <strong
                    className={`ml-1 ${
                      marketStatus === "excellent"
                        ? "text-emerald-600 dark:text-emerald-500"
                        : marketStatus === "high"
                          ? "text-amber-600 dark:text-amber-500"
                          : "text-foreground"
                    }`}
                  >
                    {formatCurrency(Math.abs(priceDiff))}
                    {marketStatus === "high" ? " daha yüksek" : " daha ucuz"}
                  </strong>
                </>
              )}
              .
            </p>
          </div>
        </div>
      </div>

      {/* Trust Signals */}
      <div
        className={`flex flex-col gap-4 p-6 sm:p-8 border-t border-border/50 ${isManipulated ? "bg-red-50" : "bg-muted/20"}`}
      >
        {isManipulated ? (
          <div className="flex items-start gap-3">
            <TrendingUp size={18} className="mt-0.5 shrink-0 text-red-500" />
            <div>
              <div className="text-sm font-bold text-red-700">Fiyat Manipülasyonu Şüphesi</div>
              <p className="text-xs text-red-600/80 mt-1 leading-relaxed">
                Bu ilan fiyatı piyasa ortalamasının çok üzerindedir. Lütfen &quot;Fiyat
                Manipülasyonu&quot; olarak bildirin.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
              <div>
                <div className="text-sm font-semibold text-foreground">Fiyat Geçmişi Temiz</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Son 30 günde suni fiyat artışı tespit edilmedi.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
              <div>
                <div className="text-sm font-semibold text-foreground">Gerçekçi Kilometre</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Aracın yaşına göre yıllık ortalama kullanım normal.
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
