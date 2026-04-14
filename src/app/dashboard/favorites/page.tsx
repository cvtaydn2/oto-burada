import { FavoritesPageClient } from "@/components/listings/favorites-page-client";
import { FavoritesPriceAlerts } from "@/components/listings/favorites-price-alerts";
import { requireUser } from "@/lib/auth/session";
import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";

export const dynamic = "force-dynamic";
// revalidate kaldırıldı — force-dynamic ile çakışıyor

export default async function DashboardFavoritesPage() {
  const user = await requireUser();
  const listings = await getPublicMarketplaceListings({ limit: 100, page: 1, sort: "newest" });

  return (
    <div className="space-y-8">
      <FavoritesPriceAlerts />
      <FavoritesPageClient listings={listings.listings} userId={user.id} />
    </div>
  );
}
