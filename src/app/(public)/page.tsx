import type { Metadata } from "next";
import { Zap, Trophy, BadgeCheck, CarFront, ChevronRight, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { HomeHero } from "@/components/layout/home-hero";
import { CarCard } from "@/components/modules/listings/car-card";
import { buildListingsMetadata, getAppUrl } from "@/lib/seo";
import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";
import { WebSiteStructuredData, OrganizationStructuredData } from "@/components/seo/structured-data";
import { getLiveMarketplaceReferenceData } from "@/services/reference/live-reference-data";

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
  const featuredBrands = references.brands.slice(0, 6);
  const featuredCities = references.cities.slice(0, 6);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <WebSiteStructuredData url={appUrl} />
      <OrganizationStructuredData 
        name="OtoBurada"
        url={appUrl}
        description="Türkiye'nin en güvenilir, şeffaf ve hızlı ikinci el otomobil pazarı. Aradığın araba burada."
      />

      <main className="flex-1 w-full">
        {/* Modern Hero */}
        <HomeHero cities={references.cities.map((city) => city.city)} />

        {/* Popular Discovery */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Canlı Keşif Alanları</h2>
            <Link href="/listings" className="text-sm font-medium text-blue-500 hover:text-blue-600 flex items-center transition">
              Tümünü Gör <ChevronRight size={14} className="ml-1" />
            </Link>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <CarFront size={18} className="text-blue-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Markalar</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {featuredBrands.map((brand) => (
                  <Link
                    key={brand.slug}
                    href={`/listings?brand=${encodeURIComponent(brand.brand)}`}
                    className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:border-blue-100 transition group flex flex-col"
                  >
                    <div className="w-11 h-11 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-500 group-hover:text-white transition">
                      <CarFront size={18} />
                    </div>
                    <h4 className="font-bold text-gray-800">{brand.brand}</h4>
                    <p className="mt-1 text-xs text-gray-500">
                      {brand.models.length} model, {brand.models.reduce((sum, model) => sum + model.trims.length, 0)} paket
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center gap-2">
                <Trophy size={18} className="text-blue-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Şehirler</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {featuredCities.map((city) => (
                  <Link
                    key={city.slug}
                    href={`/listings?city=${encodeURIComponent(city.city)}`}
                    className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:border-blue-100 transition group flex flex-col"
                  >
                    <div className="w-11 h-11 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-500 group-hover:text-white transition">
                      <BadgeCheck size={18} />
                    </div>
                    <h4 className="font-bold text-gray-800">{city.city}</h4>
                    <p className="mt-1 text-xs text-gray-500">
                      {city.districts.length} ilçe
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Section */}
        {featuredListings.length > 0 && (
          <section className="bg-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-end mb-8">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-800">Öne Çıkan İlanlar</h2>
                </div>
                <Link href="/listings?featured=true" className="text-sm font-medium text-blue-500 hover:text-blue-600 flex items-center">
                  Tümünü Gör <ChevronRight size={14} className="ml-1" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredListings.map((listing, index) => (
                  <CarCard key={listing.id} listing={listing} priority={index < 4} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Latest Listings */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Yeni İlanlar</h2>
            <Link href="/listings" className="text-sm font-medium text-blue-500 hover:text-blue-600 flex items-center transition">
              Tümünü Gör <ChevronRight size={14} className="ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestListings.map((listing) => (
              <CarCard key={listing.id} listing={listing} />
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <Link href="/listings" className="bg-blue-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-600 transition shadow-lg shadow-blue-500/20">
              Tüm İlanları Keşfet
            </Link>
          </div>
        </section>

        {/* Services / Trust */}
        <section className="bg-gray-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Güvenli Araç Alışverişinin Adresi</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">Tüm ilanlarımız kimlik onaylıdır ve şeffaf ekspertiz raporu desteğiyle sunulur.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: <ShieldCheck size={32} />, title: "Onaylı Profil", desc: "Tüm satıcılarımız e-Devlet destekli kimlik doğrulaması yapar." },
                { icon: <CheckCircle2 size={32} />, title: "Şeffaf Ekspertiz", desc: "Aracın tüm durumu dijital raporlarla net şekilde sunulur." },
                { icon: <Zap size={32} />, title: "AI Değerleme", desc: "Aracınızın gerçek piyasa değerini saniyeler içinde öğrenin." },
              ].map((item, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
                  <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
