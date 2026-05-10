import { Heart } from "lucide-react";
import type { Metadata } from "next";

import { requireUser } from "@/features/auth/lib/session";
import { getDatabaseFavoriteIds } from "@/features/favorites/services/favorite-records";
import { FavoritesPageClient } from "@/features/marketplace/components/favorites-page-client";
import { getMarketplaceListingsByIds } from "@/features/marketplace/services/marketplace-listings";
import { buildAbsoluteUrl } from "@/features/seo/lib";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard Favoriler | OtoBurada",
  description: "Takip ettiğiniz araç ilanlarını dashboard içinde tek listede yönetin.",
  alternates: {
    canonical: buildAbsoluteUrl("/dashboard/favorites"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardFavoritesPage() {
  const user = await requireUser();

  const favoriteIds = await getDatabaseFavoriteIds(user.id);
  const listings =
    favoriteIds && favoriteIds.length > 0 ? await getMarketplaceListingsByIds(favoriteIds) : [];

  return (
    <div className="space-y-6">
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Favorilerim</h1>
          <p className="mt-1 text-sm text-muted-foreground font-medium">
            Takip ettiğin araçları buradan yönet.
          </p>
        </div>
      </div>

      <FavoritesPageClient listings={listings} userId={user.id} />
    </div>
  );
}
