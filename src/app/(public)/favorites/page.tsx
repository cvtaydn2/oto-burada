import { FavoritesPageClient } from "@/components/listings/favorites-page-client";
import { getCurrentUser } from "@/lib/auth/session";
import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";
import { Heart, ChevronLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function FavoritesPage() {
  const [user, listings] = await Promise.all([
    getCurrentUser(),
    getPublicMarketplaceListings({ limit: 100, page: 1, sort: "newest" }),
  ]);

  return (
    <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
           <div className="flex items-center gap-4 mb-4">
              <Link href="/" className="flex size-11 items-center justify-center rounded-xl bg-slate-950 text-white shadow-xl shadow-slate-900/10 hover:scale-105 transition-transform">
                 <ChevronLeft className="size-5" />
              </Link>
              <div className="h-px w-12 bg-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">Kişisel Envanter</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-black tracking-tightest leading-tight text-slate-900 uppercase italic">
              FAVORİ <span className="text-primary">İLANLARIM</span>
           </h1>
           <p className="mt-4 text-sm font-medium text-slate-400 italic leading-relaxed">
              Takibinizdeki araçları dijital showroom&apos;unuzda tek panelden yönetin ve piyasa hareketlerini izleyin.
           </p>
        </div>
      </div>

      <FavoritesPageClient listings={listings.listings} userId={user?.id} />
    </div>
  );
}
