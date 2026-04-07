import { FavoritesPageClient } from "@/components/listings/favorites-page-client";
import { getCurrentUser } from "@/lib/auth/session";
import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";

export default async function DashboardFavoritesPage() {
  const user = await getCurrentUser();
  const listings = await getPublicMarketplaceListings();

  return <FavoritesPageClient listings={listings} userId={user?.id} />;
}
