import { LineChart } from "lucide-react";

import { PriceHistoryChart } from "@/components/listings/price-history-chart";
import { Panel } from "@/components/shared/design-system/Panel";
import { SectionHeader } from "@/components/shared/design-system/SectionHeader";
import type { ListingCardInsight } from "@/services/listings/listing-card-insights";
import { getListingPriceHistory } from "@/services/listings/listing-price-history";
import type { Listing } from "@/types";

interface ListingAnalysisSectionProps {
  listing: Listing;
  insight: ListingCardInsight;
}

export async function ListingAnalysisSection({ listing, insight }: ListingAnalysisSectionProps) {
  const priceHistory = await getListingPriceHistory(listing.id);
  return (
    <Panel padding="xl">
      <SectionHeader title="Pazar Analizi & Fiyat Değişimi" icon={LineChart} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-muted/30 border border-border/40">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
              SHOWROOM İPUCU
            </h4>
            <p className="text-base font-medium leading-relaxed text-foreground/80">
              {insight.summary}
            </p>
          </div>
          <p className="text-xs text-muted-foreground leading-loose">
            * Bu analiz, benzer model ve yaştaki araçların son 30 günlük pazar verilerine
            dayanmaktadır.
          </p>
        </div>
        <div className="h-64">
          <PriceHistoryChart history={priceHistory} currentPrice={listing.price} />
        </div>
      </div>
    </Panel>
  );
}
