import { FavoritesPageClient } from "@/components/listings/favorites-page-client";
import { exampleListings } from "@/data";

export default function DashboardFavoritesPage() {
  return <FavoritesPageClient listings={exampleListings} />;
}
