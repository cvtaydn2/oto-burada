import { ListingCard } from "@/components/shared/listing-card";
import { Panel } from "@/components/shared/design-system/Panel";
import type { Listing } from "@/types";

interface ListingRelatedProps {
  similarListings: Listing[];
}

export function ListingRelated({ similarListings }: ListingRelatedProps) {
  if (similarListings.length === 0) return null;

  return (
    <Panel padding="xl">
      <h2 className="mb-8 text-xl font-bold text-foreground tracking-tight">Benzer İlanlar</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {similarListings.slice(0, 3).map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
    </Panel>
  );
}
