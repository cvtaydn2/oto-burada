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
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Popüler Kategoriler</h2>
            <Link href="/listings" className="text-sm font-medium text-blue-500 hover:text-blue-600 flex items-center gap-1 transition">
              Tümünü Gör <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { id: 'electric', name: 'Elektrikli', count: '1,240', icon: <Zap size={20} /> },
              { id: 'suv', name: 'SUV', count: '4,850', icon: <CarFront size={20} /> },
              { id: 'sedan', name: 'Sedan', count: '12,400', icon: <Search size={20} /> },
              { id: 'classic', name: 'Klasik', count: '450', icon: <Trophy size={20} /> },
              { id: 'commercial', name: 'Ticari', count: '2,100', icon: <BadgeCheck size={20} /> },
              { id: 'hatchback', name: 'Hatchback', count: '8,920', icon: <TrendingDown size={20} /> },
            ].map((cat) => (
              <Link
                key={cat.id}
                href={`/listings?body_type=${cat.id}`}
                className="group p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all flex flex-col items-center text-center gap-3"
              >
                <div className="size-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                  {cat.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">{cat.name}</h3>
                  <p className="text-[11px] text-gray-400 font-medium">{cat.count} İlan</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Section */}
        {featuredListings.length > 0 && (
          <section className="mb-20">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Zap className="text-amber-500 fill-amber-500" size={20} />
                <h2 className="text-2xl font-bold text-gray-800">Öne Çıkan İlanlar</h2>
              </div>
              <Link href="/listings?featured=true" className="text-sm font-medium text-blue-500 hover:underline flex items-center gap-1">
                Tümünü Gör <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredListings.map((listing) => (
                <CarCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )}

        {/* Trust Section */}
        <section className="mb-20">
          <div className="bg-white rounded-3xl border border-gray-100 p-10 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="text-blue-500" size={18} />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Güven Odaklı Pazar</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Neden OtoBurada?
              </h2>
              <p className="text-gray-500 font-medium mb-10 max-w-xl leading-relaxed">
                Türkiye&apos;nin en güvenilir, şeffaf ve hızlı ikinci el otomobil pazarıyız. Tüm süreçleri teknolojiyle şeffaf kılıyoruz.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { icon: <Search className="text-blue-500" size={24} />, title: "AI Fiyat Analizi", desc: "Gerçek piyasa değerleri" },
                  { icon: <BadgeCheck className="text-blue-500" size={24} />, title: "Doğrulanmış İlanlar", desc: "Kimlik onaylı satıcılar" },
                  { icon: <Trophy className="text-blue-500" size={24} />, title: "Hızlı Yayın", desc: "2 dakikada ilan ver" },
                  { icon: <ShieldCheck className="text-blue-500" size={24} />, title: "Ücretsiz İlan", desc: "Komisyonsuz satış" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-3 group">
                    <div className="size-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">{item.icon}</div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-500 transition-colors">{item.title}</h3>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="mb-20 grid md:grid-cols-2 gap-6">
          <Link href="/aracim-ne-kadar" className="group p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all flex items-center gap-6">
            <div className="size-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all shrink-0">
              <ArrowRight className="-rotate-45" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Aracım Ne Kadar?</h3>
              <p className="text-sm text-gray-400 font-medium mt-0.5">Yapay zeka ile aracınızın değerini anında öğrenin.</p>
            </div>
          </Link>

          <Link href="/listings?sort=advantageous" className="group p-8 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all flex items-center gap-6">
            <div className="size-14 rounded-full bg-emerald-500 flex items-center justify-center text-white group-hover:bg-emerald-600 transition-all shrink-0">
              <TrendingDown size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Fırsat İlanlar</h3>
              <p className="text-sm text-emerald-600/70 font-medium mt-0.5">Piyasa değerinin altındaki avantajlı araçları keşfedin.</p>
            </div>
          </Link>
        </section>

        {/* Latest Listings */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Yeni İlanlar</h2>
            <Link href="/listings" className="text-sm font-medium text-blue-500 hover:underline flex items-center gap-1 transition">
              Tümünü Gör <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestListings.map((listing) => (
              <CarCard key={listing.id} listing={listing} />
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <Link href="/listings" className="h-12 px-10 rounded-xl bg-blue-500 text-white font-bold text-base hover:bg-blue-600 transition-all flex items-center justify-center shadow-lg shadow-blue-500/20">
              Tüm İlanları Keşfet
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
