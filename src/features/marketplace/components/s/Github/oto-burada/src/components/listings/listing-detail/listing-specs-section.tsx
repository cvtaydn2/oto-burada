import { Info, Settings } from "lucide-react";

import { ListingSpecs } from "@/features/marketplace/components/listing-specs";
import { Panel } from "@/features/shared/components/design-system/Panel";
import { SectionHeader } from "@/features/shared/components/design-system/SectionHeader";
import type { Listing } from "@/types";

interface ListingSpecsSectionProps {
  listing: Listing;
}

export function ListingSpecsSection({ listing }: ListingSpecsSectionProps) {
  return (
    <Panel padding="xl">
      <SectionHeader
        title="Teknik Detaylar"
        icon={Settings}
        action={
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <Info size={14} className="text-primary" />
            Fabrika Verileri
          </div>
        }
      />
      <ListingSpecs listing={listing} />
    </Panel>
  );
}
