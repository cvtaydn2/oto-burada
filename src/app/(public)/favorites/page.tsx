import { FavoritesPageClient } from "@/components/listings/favorites-page-client";
import { getCurrentUser } from "@/lib/auth/session";
import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
// revalidate kaldırıldı — force-dynamic ile çakışıyor

export default async function FavoritesPage() {
  const [user, listings] = await Promise.all([
    getCurrentUser(),
    getPublicMarketplaceListings({ limit: 100, page: 1, sort: "newest" }),
  ]);

  return (
    <div className="mx-auto max-w-[1280px] space-y-8 px-5 py-8 lg:px-6 lg:py-10">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="max-w-2xl">
           <div className="mb-4 flex items-center gap-3">
              <Link href="/" className="flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-transform hover:bg-slate-50">
                 <ChevronLeft className="size-4" />
              </Link>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kişisel envanter</span>
           </div>
           <h1 className="text-3xl font-black leading-tight text-slate-900 md:text-4xl">
               Favori ilanlarım
           </h1>
           <p className="mt-2.5 text-sm font-medium leading-relaxed text-slate-500">
               Beğendiğiniz araçları tek listede toplayın ve takip edin.
           </p>
        </div>
      </div>

      <FavoritesPageClient listings={listings.listings} userId={user?.id} />
    </div>
  );
}
