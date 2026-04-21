import { Settings, Info } from "lucide-react";
import { ListingSpecs } from "@/components/listings/listing-specs";
import { SectionHeader } from "@/components/shared/design-system/SectionHeader";
import { Panel } from "@/components/shared/design-system/Panel";
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
