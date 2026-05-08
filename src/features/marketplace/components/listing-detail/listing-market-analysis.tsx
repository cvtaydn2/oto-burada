import { TrendingDown } from "lucide-react";
import dynamic from "next/dynamic";

import { PriceAnalysisWidget } from "@/features/marketplace/components/price-analysis-widget";

const PriceHistoryChart = dynamic(
  () =>
    import("@/features/marketplace/components/price-history-chart").then(
      (m) => m.PriceHistoryChart
    ),
  { loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" /> }
);

interface MarketValuation {
  status: "good" | "fair" | "high" | "unknown";
  diff: number;
  avgPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  listingCount?: number | null;
}

interface ListingMarketAnalysisProps {
  listingId: string;
  listingPrice: number;
  marketValuation: MarketValuation;
}

export function ListingMarketAnalysis({
  listingId,
  listingPrice,
  marketValuation,
}: ListingMarketAnalysisProps) {
  return (
    <section id="fiyat" className="scroll-mt-24 rounded-2xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <TrendingDown size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Piyasa Analizi</h2>
          <p className="text-xs text-muted-foreground">
            İlanın fiyat geçmişi ve piyasa karşılaştırması
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
        <PriceHistoryChart listingId={listingId} currentPrice={listingPrice} />

        <div className="space-y-4">
          <PriceAnalysisWidget
            currentPrice={listingPrice}
            avgPrice={marketValuation.avgPrice!}
            minPrice={marketValuation.minPrice!}
            maxPrice={marketValuation.maxPrice!}
            status={marketValuation.status}
          />

          <div className="rounded-xl bg-muted/30 p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Veri Analizi
            </div>
            <div className="text-[11px] text-muted-foreground">
              {marketValuation.listingCount
                ? `${marketValuation.listingCount} benzer ilan baz alınarak hesaplanmıştır.`
                : "Henüz yeterli piyasa verisi bulunmamaktadır."}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
