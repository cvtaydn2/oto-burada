import { Heart } from "lucide-react";
import { FavoritesPageClient } from "@/components/listings/favorites-page-client";
import { requireUser } from "@/lib/auth/session";
import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";

export const dynamic = "force-dynamic";

export default async function DashboardFavoritesPage() {
  const user = await requireUser();
  const listings = await getPublicMarketplaceListings({ limit: 100, page: 1, sort: "newest" });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Heart size={14} className="fill-current" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Favori Listesi
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Favorilerim
          </h1>
          <p className="mt-1 text-sm text-muted-foreground font-medium">
            Takip ettiğin araçları buradan yönet.
          </p>
        </div>
      </div>

      <FavoritesPageClient listings={listings.listings} userId={user.id} />
    </div>
  );
}
