import { CarFront, CheckCircle2, ChevronRight, MapPin, ShieldCheck, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { HomeHero } from "@/components/layout/home-hero";
import {
  OrganizationStructuredData,
  WebSiteStructuredData,
} from "@/components/seo/structured-data";
import { ListingCard } from "@/components/shared/listing-card";
import { getAppUrl } from "@/lib/seo";
import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";
import { getLiveMarketplaceReferenceData } from "@/services/reference/live-reference-data";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "İkinci El Araba İlanları | OtoBurada - Güvenli Araç Pazaryeri",
    description:
      "Türkiye genelinde ikinci el araba ilanları. Uygun fiyatlı araçları keşfet, kolayca satın al veya ücretsiz ilan vererek hemen sat. En güvenilir otomobil pazarı.",
    alternates: {
      canonical: getAppUrl(),
    },
    openGraph: {
      title: "İkinci El Araba İlanları | OtoBurada",
      description:
        "Türkiye genelinde binlerce ikinci el araba ilanı. Güvenle satın al, kolayca sat.",
      type: "website",
      url: getAppUrl(),
      siteName: "OtoBurada",
    },
  };
}

export default async function HomePage() {
  const [listingsResult, references] = await Promise.all([
    getPublicMarketplaceListings({ limit: 12, sort: "newest" }),
    getLiveMarketplaceReferenceData(),
  ]);

  const appUrl = getAppUrl();
  const featuredListings = listingsResult.listings.filter((l) => l.featured).slice(0, 4);
  const featuredIds = new Set(featuredListings.map((l) => l.id));
  const latestListings = listingsResult.listings.filter((l) => !featuredIds.has(l.id)).slice(0, 8);
  const featuredBrands = references.brands.slice(0, 6);
  const featuredCities = references.cities.slice(0, 6);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <WebSiteStructuredData url={appUrl} />
      <OrganizationStructuredData
        name="OtoBurada"
        url={appUrl}
        description="Türkiye'nin en güvenilir, şeffaf ve hızlı ikinci el otomobil pazarı. Aradığın araba burada."
      />

      <main className="flex-1 w-full">
        <HomeHero cities={references.cities.map((city) => city.city)} />

        {/* Quick Discovery */}
        <section className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-10 md:py-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Hızlı Keşfet</h2>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
                Aradığın araca giden en kısa yol
              </p>
            </div>
            <Link
              href="/listings"
              prefetch={false}
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1 transition"
            >
              Tümünü İncele <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Brands */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Markalar
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                {featuredBrands.slice(0, 6).map((brand) => (
                  <Link
                    key={brand.slug}
                    href={`/satilik/${brand.slug}`}
                    prefetch={false}
                    className="group flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 shadow-sm transition-colors hover:border-primary/20 hover:bg-muted/30"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/70 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                      <CarFront size={18} strokeWidth={1.9} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-foreground truncate">
                        {brand.brand}
                      </h4>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {brand.models.length} model
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Cities */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Şehirler
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                {featuredCities.slice(0, 6).map((city) => (
                  <Link
                    key={city.slug}
                    href={`/satilik-araba/${city.slug}`}
                    prefetch={false}
                    className="group flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 shadow-sm transition-colors hover:border-primary/20 hover:bg-muted/30"
                  >
                    <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                      <MapPin size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-foreground truncate">
                        {city.city}
                      </h4>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {city.districts.length} ilçe
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Section */}
        {featuredListings.length > 0 && (
          <section className="bg-muted/30 py-8 sm:py-10 md:py-12">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Öne Çıkan İlanlar</h2>
                <Link
                  href="/listings"
                  prefetch={false}
                  className="text-sm font-medium text-primary hover:underline flex items-center"
                >
                  Tüm İlanları Gör <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {featuredListings.map((listing, index) => (
                  <ListingCard key={listing.id} listing={listing} priority={index < 2} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Latest Listings */}
        <section className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-10 md:py-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Yeni İlanlar</h2>
            <Link
              href="/listings"
              prefetch={false}
              className="text-sm font-medium text-primary hover:underline flex items-center"
            >
              Tümünü Gör <ChevronRight size={14} />
            </Link>
          </div>
          {latestListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {latestListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 sm:p-10 text-center">
              <CarFront size={40} className="mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-bold text-card-foreground mb-2">Henüz ilan bulunmuyor</h3>
              <p className="text-muted-foreground text-sm mb-6">
                İlk ilanı sen vererek platformda yerini al.
              </p>
              <Link
                href="/dashboard/listings/create"
                prefetch={false}
                className="inline-flex items-center justify-center bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition"
              >
                Hemen İlan Ver
              </Link>
            </div>
          )}
          <div className="mt-8 flex justify-center">
            <Link
              href="/listings"
              prefetch={false}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:bg-primary/90 transition shadow-sm"
            >
              Tüm İlanları Keşfet
            </Link>
          </div>
        </section>

        {/* Trust Section */}
        <section className="bg-muted/30 py-10 sm:py-12 md:py-16 border-y border-border">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
                Güvenilir Araç Pazarı
              </h2>
              <p className="text-sm text-muted-foreground">
                Tüm ilanlar moderasyondan geçer ve şeffaf fiyatlandırma ile sunulur.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {[
                {
                  icon: <ShieldCheck size={24} />,
                  title: "Moderasyon",
                  desc: "Tüm ilanlar inceleme sürecinden geçer. Şüpheli içerikler engellenir.",
                },
                {
                  icon: <CheckCircle2 size={24} />,
                  title: "Ekspertiz Desteği",
                  desc: "Araç geçmişi ve teknik durum şeffaf şekilde paylaşılır.",
                },
                {
                  icon: <Zap size={24} />,
                  title: "Hızlı İletişim",
                  desc: "Satıcılarla doğrudan WhatsApp üzerinden iletişim kurun.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-card border border-border p-5 sm:p-6 rounded-2xl transition-colors hover:bg-muted/50"
                >
                  <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-base font-bold text-card-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why OtoBurada */}
        <section className="bg-background py-10 sm:py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
                  Neden OtoBurada?
                </h2>
                <p className="text-muted-foreground mb-6">
                  OtoBurada ile ikinci el araba alım satım işlemlerinizi hızlı ve güvenli şekilde
                  gerçekleştirin.
                </p>
                <ul className="space-y-3">
                  {[
                    "Ücretsiz ilan verme ve hızlı satış imkanı",
                    "Moderasyondan geçen ilanlar ve güvenilir satıcı profilleri",
                    "Gelişmiş filtreleme ile doğru araca 3 adımda ulaşım",
                    "WhatsApp üzerinden doğrudan satıcı iletişimi",
                    "Mobil uyumlu, hızlı ve sade kullanıcı deneyimi",
                  ].map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3 text-sm">
                      <div className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <CheckCircle2 size={12} />
                      </div>
                      <span className="text-foreground/80">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border">
                <h3 className="text-lg font-bold text-foreground mb-4">Popüler Arama</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Markalar
                    </h4>
                    <ul className="space-y-2 text-sm">
                      {references.brands.slice(0, 5).map((b) => (
                        <li key={b.slug}>
                          <Link
                            href={`/satilik/${b.slug}`}
                            prefetch={false}
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            {b.brand}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Şehirler
                    </h4>
                    <ul className="space-y-2 text-sm">
                      {references.cities.slice(0, 5).map((c) => (
                        <li key={c.slug}>
                          <Link
                            href={`/satilik-araba/${c.slug}`}
                            prefetch={false}
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            {c.city}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
