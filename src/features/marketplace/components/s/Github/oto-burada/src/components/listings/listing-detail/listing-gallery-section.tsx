import { ShieldCheck } from "lucide-react";

import { ListingGallery } from "@/features/marketplace/components/listing-gallery";
import { ListingPromoBadges } from "@/features/marketplace/components/listing-promo-badges";
import { getListingDopingDisplayItems } from "@/features/marketplace/lib/utils";
import { Panel } from "@/features/shared/components/design-system/Panel";
import type { Listing } from "@/types";

interface ListingGallerySectionProps {
  listing: Listing;
}

export function ListingGallerySection({ listing }: ListingGallerySectionProps) {
  const dopingItems = getListingDopingDisplayItems(listing);

  return (
    <Panel padding="none" className="relative group p-6">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border/40 bg-muted">
        <ListingGallery images={listing.images} title={listing.title} />

        <div className="absolute left-8 top-8 z-20 flex flex-col gap-3">
          <ListingPromoBadges items={dopingItems} limit={2} variant="glass" />
          {listing.expertInspection && (
            <div className="bg-card text-foreground text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl shadow-lg border border-border flex items-center gap-2">
              <ShieldCheck size={14} className="text-primary" />
              EKSPERTİZ ONAYLI
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
