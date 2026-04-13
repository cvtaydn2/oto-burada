import type { Metadata } from "next";
import { ArrowRight, Zap, ShieldCheck, Trophy, BadgeCheck, TrendingDown, CarFront, Search } from "lucide-react";
import Link from "next/link";

import { HomeHero } from "@/components/layout/home-hero";
import { CarCard } from "@/components/modules/listings/car-card";
import { buildListingsMetadata, getAppUrl } from "@/lib/seo";
import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";
import { WebSiteStructuredData, OrganizationStructuredData } from "@/components/seo/structured-data";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildListingsMetadata({ sort: "newest" });
}

export default async function HomePage() {
  const listingsResult = await getPublicMarketplaceListings({ limit: 12, sort: "newest" });

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

      <main className="flex-1 w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-6">
        {/* Modern Hero */}
        <HomeHero />

        {/* Popular Categories */}
        <section className="mb-24 mt-28">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Popüler Kategoriler</h2>
            <Link href="/categories" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition">
              Tümünü Gör <ArrowRight size={10} className="ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3.5">
            {[
              { id: 'electric', name: 'Elektrikli', count: '1,240', icon: <Zap size={18} /> },
              { id: 'suv', name: 'SUV', count: '4,850', icon: <CarFront size={18} /> },
              { id: 'sedan', name: 'Sedan', count: '12,400', icon: <ShieldCheck size={18} /> },
              { id: 'classic', name: 'Klasik', count: '450', icon: <Trophy size={18} /> },
              { id: 'commercial', name: 'Ticari', count: '2,100', icon: <BadgeCheck size={18} /> },
              { id: 'hatchback', name: 'Hatchback', count: '8,920', icon: <TrendingDown size={18} /> },
            ].map((cat) => (
              <Link
                key={cat.id}
                href={`/listings?body_type=${cat.id}`}
                className="group p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-lg hover:border-primary/20 transition-all flex flex-col items-center text-center gap-2"
              >
                <div className="size-10 rounded-lg bg-slate-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  {cat.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                  <p className="text-[11px] text-slate-400">{cat.count} ilan</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Section */}
        {featuredListings.length > 0 && (
          <section className="mb-20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Zap className="text-amber-500 fill-amber-500" size={20} />
                <h2 className="text-xl font-black text-slate-900">Öne Çıkanlar</h2>
              </div>
              <Link href="/listings?featured=true" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                Tümünü Gör <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {featuredListings.map((listing) => (
                <CarCard key={listing.id} listing={listing} priority />
              ))}
            </div>
          </section>
        )}

        {/* Trust Section */}
        <section className="mb-20">
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck className="text-emerald-500" size={18} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Güven Odaklı Pazar</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3">
              Neden OtoBurada?
            </h2>
            <p className="text-muted-foreground font-medium mb-8 max-w-xl">
              Tüm süreçleri şeffaf kılarak alıcı ve satıcı arasındaki güveni üst seviyeye taşıyoruz.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <Search className="text-primary" size={22} />, title: "Yapay Zeka Fiyat Analizi", desc: "Piyasa verileriyle gerçek değer" },
                { icon: <BadgeCheck className="text-primary" size={22} />, title: "EİDS Doğrulaması", desc: "Kimlik onaylı satıcılar" },
                { icon: <Trophy className="text-primary" size={22} />, title: "En Hızlı İlan Süreci", desc: "2 dakikada ilan yayınla" },
                { icon: <ShieldCheck className="text-primary" size={22} />, title: "Ücretsiz İlan", desc: "Herkes ücretsiz yayınlar" },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-100 flex flex-col gap-3 hover:border-primary/20 transition-colors">
                  <div className="size-10 rounded-lg bg-slate-50 flex items-center justify-center">{item.icon}</div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-muted-foreground font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Marketplace Services */}
        <section className="mb-28 grid md:grid-cols-2 gap-6">
          <Link href="/aracim-ne-kadar" className="group p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex items-center gap-6">
            <div className="size-14 rounded-xl bg-slate-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
              <ArrowRight className="rotate-[315deg]" size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">Aracım Ne Kadar?</h3>
              <p className="text-sm text-muted-foreground font-medium">Piyasa verileriyle aracınızın güncel değerini öğrenin.</p>
            </div>
          </Link>

          <Link href="/listings?sort=advantageous" className="group p-8 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm hover:shadow-md transition-all flex items-center gap-6">
            <div className="size-14 rounded-xl bg-emerald-500 flex items-center justify-center text-white group-hover:bg-emerald-600 transition-all shrink-0">
              <TrendingDown size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">Fırsat İlanlar</h3>
              <p className="text-sm text-muted-foreground font-medium">Piyasa ortalamasının altında avantajlı araçlar.</p>
            </div>
          </Link>
        </section>

        {/* Latest Listings */}
        <section className="mb-28">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-900">Yeni İlanlar</h2>
            <Link href="/listings" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              Tüm İlanları Gör <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {latestListings.map((listing) => (
              <CarCard key={listing.id} listing={listing} />
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <Link href="/listings" className="h-12 px-8 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary/90 transition-all flex items-center justify-center">
              Tüm İlanları Keşfet
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
