import { FavoritesPageClient } from "@/components/listings/favorites-page-client";
import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";

export default async function DashboardFavoritesPage() {
  const listings = await getPublicMarketplaceListings();

  return <FavoritesPageClient listings={listings} />;
}
