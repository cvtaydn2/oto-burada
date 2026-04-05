import { TrendingDown, TrendingUp, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PriceAnalysisCardProps {
  price: number;
  marketStatus: "excellent" | "fair" | "high";
  priceDiff: number;
}

export function PriceAnalysisCard({
  price,
  marketStatus,
  priceDiff,
}: PriceAnalysisCardProps) {
  const avgPrice =
    marketStatus === "high" ? price - priceDiff : price + Math.abs(priceDiff);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-background shadow-sm">
      <div className="border-b border-border/50 p-6 sm:p-8">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          İlan Fiyatı
        </div>
        <div className="mb-6 text-4xl font-bold tracking-tight text-foreground">
          {formatCurrency(price).replace("₺", "")}{" "}
          <span className="text-2xl font-medium text-muted-foreground">TL</span>
        </div>

        {/* Market Analysis Visual */}
        <div className="rounded-[1.5rem] border border-border/70 bg-muted/30 p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

          {/* Visual Graph Simulation */}
          <div className="relative mb-6 mt-4 h-16 w-full">
            {/* Background distribution bars */}
            <div className="absolute bottom-0 left-0 flex h-full w-full items-end justify-between gap-1 opacity-20">
              {[20, 30, 45, 60, 80, 100, 85, 65, 40, 25, 15].map((h, i) => (
                <div
                  key={i}
                  className="w-full rounded-t-sm bg-muted-foreground"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            {/* Average Price Marker */}
            <div className="absolute bottom-0 left-1/2 top-0 z-10 flex w-px flex-col items-center justify-start border-l border-dashed border-muted-foreground bg-muted-foreground">
              <div className="absolute -top-6 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] font-bold text-background">
                Ortalama: {formatCurrency(avgPrice)}
              </div>
            </div>

            {/* Current Price Marker */}
            <div
              className={`absolute bottom-0 top-0 z-20 flex w-0.5 flex-col items-center justify-start ${
                marketStatus === "excellent"
                  ? "left-1/4 bg-emerald-500"
                  : marketStatus === "fair"
                    ? "left-1/2 bg-blue-500"
                    : "left-3/4 bg-amber-500"
              }`}
            >
              <div
                className={`absolute -top-6 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${
                  marketStatus === "excellent"
                    ? "bg-emerald-600"
                    : marketStatus === "fair"
                      ? "bg-blue-600"
                      : "bg-amber-600"
                }`}
              >
                Bu İlan
              </div>
              <div
                className={`absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background ${
                  marketStatus === "excellent"
                    ? "bg-emerald-500"
                    : marketStatus === "fair"
                      ? "bg-blue-500"
                      : "bg-amber-500"
                }`}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-background p-3 shadow-sm">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Bu araç, benzer özelliklerdeki ilanların analizine göre piyasa
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
              .
            </p>
          </div>
        </div>
      </div>

      {/* Trust Signals */}
      <div className="flex flex-col gap-4 bg-muted/20 p-6 sm:p-8 border-t border-border/50">
        <div className="flex items-start gap-3">
          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0 text-emerald-500"
          />
          <div>
            <div className="text-sm font-semibold text-foreground">
              Fiyat Geçmişi Temiz
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Son 30 günde suni fiyat artışı tespit edilmedi.
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0 text-emerald-500"
          />
          <div>
            <div className="text-sm font-semibold text-foreground">
              Gerçekçi Kilometre
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Aracın yaşına göre yıllık ortalama kullanım normal.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
