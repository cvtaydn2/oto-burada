import { TrustSummary } from "@/components/listings/trust-summary";
import { Panel } from "@/components/shared/design-system/Panel";
import type { Listing, Profile } from "@/types";
import type { ListingCardInsight } from "@/services/listings/listing-card-insights";

interface ListingPriceTrustProps {
  listing: Listing;
  seller: Partial<Profile> | null;
  insight: ListingCardInsight;
}

export function ListingPriceTrust({ listing, seller, insight }: ListingPriceTrustProps) {
  const marketIndex = listing.marketPriceIndex;
  // marketPriceIndex: 1.0 = piyasa değeri, 0.9 = %10 ucuz, 1.1 = %10 pahalı
  const indexPercent = marketIndex != null
    ? Math.round((marketIndex - 1) * 100)
    : null;

  return (
    <Panel padding="xl">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-muted/20 p-6 rounded-2xl border border-border/40">
        <div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">DETAYLI ANALİZ</div>
          <p className="text-sm font-medium text-foreground/80 leading-relaxed max-w-2xl">
            {insight.summary}
          </p>
        </div>
        {indexPercent != null && (
          <div className="flex items-center gap-4 shrink-0">
            <div className={`size-12 rounded-2xl flex items-center justify-center font-bold text-sm ${
              indexPercent < 0 ? "bg-emerald-500/10 text-emerald-600" :
              indexPercent > 10 ? "bg-rose-500/10 text-rose-600" :
              "bg-primary/10 text-primary"
            }`}>
              {indexPercent > 0 ? `+${indexPercent}%` : `${indexPercent}%`}
            </div>
            <div className="text-sm font-bold text-foreground">
              Piyasa İndeksi:{" "}
              <span className={
                indexPercent < 0 ? "text-emerald-600" :
                indexPercent > 10 ? "text-rose-600" :
                "text-foreground"
              }>
                {indexPercent < -5 ? "Avantajlı" : indexPercent > 10 ? "Yüksek" : "Piyasa Değeri"}
              </span>
            </div>
          </div>
        )}
      </div>
      <TrustSummary listing={listing} seller={seller} updatedAt={listing.updatedAt} />
    </Panel>
  );
}
