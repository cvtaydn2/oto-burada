import { FavoritesPageClient } from "@/components/listings/favorites-page-client";
import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function DashboardFavoritesPage() {
  const listings = await getPublicMarketplaceListings();

  return <FavoritesPageClient listings={listings} userId={undefined} />;
}
