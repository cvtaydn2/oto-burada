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
  return (
    <Panel padding="xl">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-muted/20 p-6 rounded-2xl border border-border/40">
        <div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">DETAYLI ANALİZ</div>
          <p className="text-sm font-medium text-foreground/80 leading-relaxed max-w-2xl">
            {insight.summary}
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
            %
          </div>
          <div className="text-sm font-bold text-foreground">Premium İndeks: {insight.tone === "emerald" ? "Yüksek" : "Standart"}</div>
        </div>
      </div>
      <TrustSummary listing={listing} seller={seller} updatedAt={listing.updatedAt} />
    </Panel>
  );
}
