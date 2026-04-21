import { FavoritesPageClient } from "@/components/listings/favorites-page-client";
import { getCurrentUser } from "@/lib/auth/session";
import { getMarketplaceListingsByIds } from "@/services/listings/marketplace-listings";
import { getDatabaseFavoriteIds } from "@/services/favorites/favorite-records";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  
  const favoriteIds = user?.id ? await getDatabaseFavoriteIds(user.id) : null;
  const listings = favoriteIds && favoriteIds.length > 0 
    ? await getMarketplaceListingsByIds(favoriteIds)
    : [];

  return (
    <div className="mx-auto max-w-[1280px] space-y-8 px-5 py-8 lg:px-6 lg:py-10">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="max-w-2xl">
           <div className="mb-4 flex items-center gap-3">
              <Link href="/" aria-label="Ana sayfaya dön" className="flex size-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-transform hover:bg-muted/30">
                 <ChevronLeft className="size-4" aria-hidden="true" />
              </Link>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kişisel envanter</span>
           </div>
           <h1 className="text-3xl font-bold leading-tight text-foreground md:text-4xl">
               Favori ilanlarım
           </h1>
           <p className="mt-2.5 text-sm font-medium leading-relaxed text-muted-foreground">
               Beğendiğiniz araçları tek listede toplayın ve takip edin.
           </p>
        </div>
      </div>

      <FavoritesPageClient listings={listings} userId={user?.id} />
    </div>
  );
}
