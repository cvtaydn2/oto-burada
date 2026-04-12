import type { Metadata } from "next";
import { ArrowRight, Zap, ShieldCheck, Trophy, BadgeCheck, TrendingDown } from "lucide-react";
import Link from "next/link";

import { HomeHero } from "@/components/layout/home-hero";
import { CarCard } from "@/components/modules/listings/car-card";
import { buildListingsMetadata, getAppUrl } from "@/lib/seo";
import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";
import { getLiveMarketplaceReferenceData } from "@/services/reference/live-reference-data";
import { WebSiteStructuredData, OrganizationStructuredData } from "@/components/seo/structured-data";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildListingsMetadata({ sort: "newest" });
}

export default async function HomePage() {
  const [listingsResult, references] = await Promise.all([
    getPublicMarketplaceListings({ limit: 12, sort: "newest" }),
    getLiveMarketplaceReferenceData(),
  ]);

  const appUrl = getAppUrl();
  const featuredListings = listingsResult.listings.filter(l => l.featured).slice(0, 4);
  const latestListings = listingsResult.listings.slice(0, 8);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <WebSiteStructuredData url={appUrl} />
      <OrganizationStructuredData 
        name="OtoBurada"
        url={appUrl}
        description="Türkiye'nin en güvenilir, şeffaf ve hızlı ikinci el otomobil pazarı. Aradığın araba burada."
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Modern Hero */}
        <HomeHero brands={references.brands} />

        {/* Featured Section */}
        {featuredListings.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-foreground flex items-center gap-3 italic">
                  <Zap className="text-amber-500 fill-amber-500" size={28} />
                  Öne Çıkanlar
                </h2>
                <p className="text-muted-foreground font-medium mt-1">Sizin için seçtiğimiz özel ilanlar</p>
              </div>
              <Link href="/listings?featured=true" className="group flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                Tümünü Gör
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredListings.map((listing) => (
                <CarCard key={listing.id} listing={listing} priority />
              ))}
            </div>
          </section>
        )}

        {/* Trust Section (Senior Aesthetic) */}
        <section className="mb-16 py-16 px-8 rounded-3xl bg-secondary/50 border border-border flex flex-col md:flex-row items-center gap-12">
           <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-xs uppercase tracking-widest">
                 <ShieldCheck size={14} />
                 Güven Odaklı Pazar
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-foreground leading-[1.1]">
                Neden <span className="text-primary italic">OtoBurada</span>&apos;ya Güvenmelisiniz?
              </h2>
              <p className="text-lg text-muted-foreground font-medium">
                Alıcı ve satıcı arasındaki tüm süreci şeffaf kılarak dolandırıcılık riskini minimize ediyoruz.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                 <div className="flex items-center gap-2 text-sm font-bold bg-white px-4 py-2 rounded-xl border border-border shadow-sm">
                    EİDS Doğrulaması
                 </div>
                 <div className="flex items-center gap-2 text-sm font-bold bg-white px-4 py-2 rounded-xl border border-border shadow-sm">
                    Yapay Zeka Fiyat Analizi
                 </div>
              </div>
           </div>
           <div className="flex-1 grid grid-cols-2 gap-4 w-full">
              <div className="p-6 rounded-2xl bg-white border border-border shadow-sm hover:shadow-md transition-all flex flex-col justify-center items-center text-center gap-3">
                 <Trophy className="text-primary" size={32} />
                 <span className="text-base font-bold text-foreground leading-tight">En Hızlı İlan Süreci</span>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-border shadow-sm hover:shadow-md transition-all flex flex-col justify-center items-center text-center gap-3">
                 <BadgeCheck className="text-indigo-600" size={32} />
                 <span className="text-base font-bold text-foreground leading-tight">Yüzlerce Onaylı Satıcı</span>
              </div>
           </div>
        </section>

        {/* Marketplace Services (Estimation & Comparison) */}
        <section className="mb-24 grid md:grid-cols-2 gap-8">
           <Link href="/aracim-ne-kadar" className="group relative overflow-hidden p-10 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl transition-all hover:scale-[1.01]">
              <div className="absolute top-0 right-0 size-64 bg-primary/20 blur-[100px] pointer-events-none group-hover:bg-primary/30 transition-all" />
              <div className="relative z-10 space-y-6">
                 <div className="size-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <ArrowRight className="rotate-[315deg]" size={32} />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter">Aracım Ne Kadar?</h3>
                    <p className="text-slate-400 font-medium italic">Piyasa verilerini analiz ederek aracınızın güncel değerini anında öğrenin.</p>
                 </div>
                 <div className="flex items-center gap-2 text-primary font-bold">
                    Hemen Hesapla <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                 </div>
              </div>
           </Link>

           <Link href="/listings?sort=advantageous" className="group relative overflow-hidden p-10 rounded-[2.5rem] bg-emerald-600 text-white shadow-2xl transition-all hover:scale-[1.01]">
              <div className="absolute top-0 right-0 size-64 bg-white/10 blur-[100px] pointer-events-none group-hover:bg-white/20 transition-all" />
              <div className="relative z-10 space-y-6">
                 <div className="size-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <TrendingDown size={32} />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter">Fırsat İlanlar</h3>
                    <p className="text-emerald-50 font-medium italic">Piyasa ortalamasının altında, kaçırılmayacak avantajlı araçları listeleyin.</p>
                 </div>
                 <div className="flex items-center gap-2 text-white font-bold underline underline-offset-4 decoration-white/30 decoration-2">
                    İlanları Gör <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                 </div>
              </div>
           </Link>
        </section>

        {/* Latest Listings */}
        <section className="mb-24">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-foreground">Son İlanlar</h2>
              <p className="text-muted-foreground font-medium mt-1">Platforma yeni eklenen fırsatları kaçırmayın</p>
            </div>
            <Link href="/listings" className="group flex items-center gap-2 text-sm font-bold text-primary hover:underline">
              Tüm İlanları Gör
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {latestListings.map((listing) => (
              <CarCard key={listing.id} listing={listing} />
            ))}
          </div>
          <div className="mt-12 flex justify-center">
             <Link href="/listings" className="h-16 px-12 rounded-2xl bg-primary text-white font-black text-lg hover:bg-primary/90 transition-all flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-105 active:scale-95">
               Tüm İlanları Keşfet
             </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
