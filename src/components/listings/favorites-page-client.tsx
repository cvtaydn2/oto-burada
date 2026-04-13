"use client";

import Link from "next/link";
import { ArrowRight, Heart, LogIn, TrendingUp, Gauge, ShieldCheck } from "lucide-react";

import { ListingCard } from "@/components/listings/listing-card";
import { ListingsGridSkeleton } from "@/components/listings/listings-grid-skeleton";
import { useFavorites } from "@/hooks/use-favorites";
import { formatCurrency, cn } from "@/lib/utils";
import type { Listing } from "@/types";

interface FavoritesPageClientProps {
  listings: Listing[];
  userId?: string;
}

export function FavoritesPageClient({ listings, userId }: FavoritesPageClientProps) {
  const { favoriteIds, hydrated } = useFavorites();
  const isGuest = !userId;

  const favoriteListings = listings.filter((listing) =>
    favoriteIds.includes(listing.id),
  );
  
  const avgPrice =
    favoriteListings.length > 0
      ? Math.round(
          favoriteListings.reduce((total, l) => total + l.price, 0) /
            favoriteListings.length,
        )
      : 0;

  if (!hydrated) {
    return <ListingsGridSkeleton count={4} />;
  }

  if (favoriteListings.length === 0) {
    return (
      <div className="space-y-12">
        {isGuest && (
          <div className="rounded-[2.5rem] border border-primary/20 bg-primary/5 p-8 lg:p-12 text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />
            <LogIn className="mx-auto size-12 text-primary" />
            <div className="space-y-2">
               <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">BULUT SENKRONİZASYONU</h2>
               <p className="text-sm font-medium text-slate-500 italic max-w-lg mx-auto leading-relaxed">
                 Favori ilanlarınız şu an sadece bu cihazda saklanıyor. Tüm cihazlarınızdan erişmek ve fiyat değişimlerinden haberdar olmak için oturum açın.
               </p>
            </div>
            <div className="flex justify-center gap-4">
              <Link
                href="/login"
                className="h-14 px-10 rounded-2xl bg-slate-900 text-white flex items-center gap-3 text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/10 italic"
              >
                GİRİŞ YAP
              </Link>
            </div>
          </div>
        )}

        <div className="rounded-[3rem] border-2 border-dashed border-slate-100 p-20 text-center space-y-8 bg-slate-50/30">
          <div className="size-24 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-center text-slate-200 shadow-inner mx-auto">
             <Heart size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">HENÜZ FAVORİNİZ YOK</h2>
            <p className="text-sm font-medium text-slate-400 italic max-w-md mx-auto leading-relaxed">
              Piyasadaki en seçkin araçları inceleyerek beğendiklerinizi kalp ikonuna basarak bu listeye ekleyebilirsiniz.
            </p>
          </div>
          <Link
            href="/listings"
            className="inline-flex h-14 px-10 rounded-2xl bg-primary text-white items-center gap-3 text-sm font-black uppercase tracking-widest hover:bg-slate-950 transition-all shadow-xl shadow-primary/20 italic group"
          >
            İLANLARI KEŞFET
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {isGuest && (
        <div className="rounded-[2.5rem] border border-primary/20 bg-primary/5 p-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-6 group">
          <div className="flex items-center gap-6">
             <div className="size-14 rounded-2xl bg-white flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                <ShieldCheck size={28} />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Elite sync</p>
               <p className="text-sm font-black italic uppercase tracking-tighter text-slate-900">Favorileri Bulut ile Eşitleyin</p>
             </div>
          </div>
          <Link
            href="/login"
            className="h-12 px-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all italic"
          >
            OTURUM AÇ
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard label="TOPLAM TAKİP" value={String(favoriteListings.length)} icon={<Heart />} />
        <StatsCard label="ORTALAMA PİYASA" value={formatCurrency(avgPrice)} icon={<TrendingUp />} />
        <StatsCard label="DÜŞÜK KM ADEDİ" value={String(favoriteListings.filter((l) => l.mileage <= 80000).length)} icon={<Gauge />} />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {favoriteListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      <Link
        href="/listings"
        className="flex items-center justify-between p-8 rounded-[2.5rem] border-2 border-slate-100 bg-white hover:border-primary transition-all group"
      >
        <span className="text-sm font-black italic uppercase tracking-widest text-slate-900">DAHA FAZLA ELİTE İLAN KEŞFET</span>
        <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
           <ArrowRight size={24} />
        </div>
      </Link>
    </div>
  );
}

function StatsCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl shadow-slate-200/30 group relative overflow-hidden">
       <div className="absolute top-0 right-0 size-24 bg-slate-100/50 rounded-full -mr-12 -mt-12 flex items-end justify-start p-6 text-slate-300 group-hover:text-primary transition-colors">
          {icon}
       </div>
       <div className="relative z-10 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">{label}</p>
          <p className="text-3xl font-black italic tracking-tighter text-slate-900">{value}</p>
       </div>
    </div>
  );
}
