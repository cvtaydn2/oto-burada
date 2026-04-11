import { FavoritesPageClient } from "@/components/listings/favorites-page-client";
import { requireUser } from "@/lib/auth/session";
import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function DashboardFavoritesPage() {
  const user = await requireUser();
  const listings = await getPublicMarketplaceListings({ limit: 100, page: 1, sort: "newest" });

  return <FavoritesPageClient listings={listings.listings} userId={user.id} />;
}
