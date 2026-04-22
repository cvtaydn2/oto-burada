import { ShieldCheck, Zap } from "lucide-react";

import { ListingGallery } from "@/components/listings/listing-gallery";
import { Panel } from "@/components/shared/design-system/Panel";
import type { Listing } from "@/types";

interface ListingGallerySectionProps {
  listing: Listing;
}

export function ListingGallerySection({ listing }: ListingGallerySectionProps) {
  return (
    <Panel padding="none" className="relative group p-6">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border/40 bg-muted">
        <ListingGallery images={listing.images} title={listing.title} />

        <div className="absolute left-8 top-8 z-20 flex flex-col gap-3">
          {listing.featured && (
            <div className="bg-foreground text-background text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 border border-border/10">
              <Zap size={14} className="text-primary animate-pulse" />
              ÖNE ÇIKAN İLAN
            </div>
          )}
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
