import { getSimilarMarketplaceListings } from "@/features/marketplace/services/marketplace-listings";
import { Panel } from "@/features/shared/components/design-system/Panel";
import { ListingCard } from "@/features/shared/components/listing-card";

interface ListingRelatedProps {
  brand: string;
  slug: string;
  city: string;
}

export async function ListingRelated({ brand, slug, city }: ListingRelatedProps) {
  const similarListings = await getSimilarMarketplaceListings(slug, brand, city);

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

export function ListingRelatedSkeleton() {
  return (
    <Panel padding="xl">
      <div className="h-7 w-48 mb-8 bg-muted animate-pulse rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-[4/5] rounded-3xl bg-muted animate-pulse" />
        ))}
      </div>
    </Panel>
  );
}
