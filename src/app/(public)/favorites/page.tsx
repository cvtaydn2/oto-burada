import { FavoritesPageClient } from "@/components/listings/favorites-page-client";
import { getCurrentUser } from "@/lib/auth/session";
import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function FavoritesPage() {
  const [user, listings] = await Promise.all([
    getCurrentUser(),
    getPublicMarketplaceListings(),
  ]);

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
          Favoriler
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Kaydettigin ilanlar
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Begendigin araclari burada toplu goruntuleyebilir, giris yaptiginda favorilerini
          cihazlar arasinda esitleyebilirsin.
        </p>
      </div>

      <FavoritesPageClient listings={listings} userId={user?.id} />
    </section>
  );
}
