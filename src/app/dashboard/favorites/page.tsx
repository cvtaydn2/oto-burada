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
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
              <Heart size={16} className="fill-rose-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 italic">
              Kişisel Envanter
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Favori İlanlarım
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
