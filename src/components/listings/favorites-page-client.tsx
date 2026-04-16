"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Heart, LogIn, TrendingUp, Gauge, ShieldCheck } from "lucide-react";

import { ListingCard } from "@/components/listings/listing-card";
import { ListingsGridSkeleton } from "@/components/listings/listings-grid-skeleton";
import { useFavorites } from "@/hooks/use-favorites";
import { formatCurrency } from "@/lib/utils";
import type { Listing } from "@/types";

interface FavoritesPageClientProps {
  listings: Listing[];
  userId?: string;
}

export function FavoritesPageClient({ listings, userId }: FavoritesPageClientProps) {
  const { favoriteIds, hydrated } = useFavorites();
  const isGuest = !userId;

  // Memoize filtering to avoid re-running on every render
  const favoriteListings = useMemo(
    () => listings.filter((listing) => favoriteIds.includes(listing.id)),
    [listings, favoriteIds],
  );
  
  const avgPrice = useMemo(
    () =>
      favoriteListings.length > 0
        ? Math.round(
            favoriteListings.reduce((total, l) => total + l.price, 0) /
              favoriteListings.length,
          )
        : 0,
    [favoriteListings],
  );

  if (!hydrated) {
    return <ListingsGridSkeleton count={4} />;
  }

  if (favoriteListings.length === 0) {
    return (
      <div className="space-y-8">
        {isGuest && (
          <div className="relative space-y-4 overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-6 text-center lg:p-8">
            <LogIn className="mx-auto size-12 text-primary" />
            <div className="space-y-2">
               <h2 className="text-2xl font-semibold text-slate-900">Bulut senkronizasyonu</h2>
               <p className="mx-auto max-w-lg text-sm leading-relaxed text-slate-600">
                 Favori ilanlarınız şu an sadece bu cihazda saklanıyor. Tüm cihazlarınızdan erişmek ve fiyat değişimlerinden haberdar olmak için oturum açın.
               </p>
            </div>
            <div className="flex justify-center gap-4">
              <Link
                href="/login"
                className="flex h-10 items-center gap-2 rounded-md bg-slate-900 px-5 text-sm font-medium text-white transition-all hover:bg-black"
              >
                Giriş yap
              </Link>
            </div>
          </div>
        )}

        <div className="space-y-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-300">
             <Heart size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">Henüz favoriniz yok</h2>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-500">
              Piyasadaki en seçkin araçları inceleyerek beğendiklerinizi kalp ikonuna basarak bu listeye ekleyebilirsiniz.
            </p>
          </div>
          <Link
            href="/listings"
            className="group inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-white transition-all hover:bg-slate-950"
          >
            İlanları keşfet
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isGuest && (
        <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-5 md:flex-row">
          <div className="flex items-center gap-6">
             <div className="flex size-12 items-center justify-center rounded-xl bg-white text-primary">
                <ShieldCheck size={22} />
             </div>
             <div>
               <p className="mb-1 text-xs font-medium text-primary">Senkronizasyon</p>
               <p className="text-sm font-medium text-slate-900">Favorileri bulut ile eşitleyin</p>
             </div>
          </div>
          <Link
            href="/login"
            className="flex h-10 items-center justify-center rounded-md bg-slate-900 px-5 text-sm font-medium text-white transition-all hover:bg-black"
          >
            Oturum aç
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard label="TOPLAM TAKİP" value={String(favoriteListings.length)} icon={<Heart />} />
        <StatsCard label="ORTALAMA PİYASA" value={formatCurrency(avgPrice)} icon={<TrendingUp />} />
        <StatsCard label="DÜŞÜK KM ADEDİ" value={String(favoriteListings.filter((l) => l.mileage <= 80000).length)} icon={<Gauge />} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {favoriteListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      <Link
        href="/listings"
        className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-primary"
      >
        <span className="text-sm font-medium text-slate-900">Daha fazla ilan keşfet</span>
        <div className="flex size-10 items-center justify-center rounded-lg bg-slate-50 text-slate-900 shadow-sm transition-all group-hover:bg-primary group-hover:text-white">
           <ArrowRight size={18} />
        </div>
      </Link>
    </div>
  );
}

function StatsCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5">
       <div className="absolute -right-6 -top-6 flex size-16 items-end justify-start rounded-full bg-slate-100/70 p-4 text-slate-300 transition-colors group-hover:text-primary">
          {icon}
       </div>
       <div className="relative z-10 space-y-1">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
       </div>
    </div>
  );
}
