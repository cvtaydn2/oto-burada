import { CarFront, CheckCircle2, ChevronRight, MapPin, ShieldCheck, Zap } from "lucide-react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";

import { HomeErrorHandler } from "@/components/layout/home-error-handler";
import { HomeHero } from "@/components/layout/home-hero";
import {
  OrganizationStructuredData,
  WebSiteStructuredData,
} from "@/components/seo/structured-data";
import { ListingCard } from "@/components/shared/listing-card";
import { getAppUrl } from "@/lib/seo";
import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";
import { getLiveMarketplaceReferenceData } from "@/services/reference/live-reference-data";

const FeaturedCarousel = dynamic(
  () => import("@/components/listings/featured-carousel").then((mod) => mod.FeaturedCarousel),
  {
    loading: () => <div className="h-[400px] w-full animate-pulse rounded-2xl bg-muted/20" />,
  }
);

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
  const [featuredResult, galleryResult, latestResult, references] = await Promise.allSettled([
    getPublicMarketplaceListings({ limit: 4, featured: true, sort: "newest" }),
    getPublicMarketplaceListings({ limit: 8, galleryPriority: 1, sort: "newest" }),
    getPublicMarketplaceListings({ limit: 20, sort: "newest" }),
    getLiveMarketplaceReferenceData(),
  ]);

  const featuredListings =
    featuredResult.status === "fulfilled" ? featuredResult.value.listings : [];
  const galleryListings = galleryResult.status === "fulfilled" ? galleryResult.value.listings : [];
  const referencesData =
    references.status === "fulfilled"
      ? references.value
      : {
          brands: [],
          cities: [],
          searchSuggestions: [],
        };

  const featuredIds = new Set(featuredListings.map((l) => l.id));
  const galleryIds = new Set(galleryListings.map((l) => l.id));
  const latestListings =
    latestResult.status === "fulfilled"
      ? latestResult.value.listings
          .filter((l) => !featuredIds.has(l.id) && !galleryIds.has(l.id))
          .slice(0, 8)
      : [];

  const featuredBrands = referencesData.brands.slice(0, 6);
  const featuredCities = referencesData.cities.slice(0, 6);
  const appUrl = getAppUrl();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <WebSiteStructuredData url={appUrl} />
      <OrganizationStructuredData
        name="OtoBurada"
        url={appUrl}
        description="Türkiye'nin en güvenilir, şeffaf ve hızlı ikinci el otomobil pazarı. Aradığın araba burada."
      />

      <main className="w-full flex-1">
        <HomeErrorHandler
          results={{
            featuredStatus: featuredResult.status,
            galleryStatus: galleryResult.status,
            latestStatus: latestResult.status,
          }}
        />
        <HomeHero
          cities={referencesData.cities.map((city) => city.city)}
          searchSuggestions={referencesData.searchSuggestions}
        />

        <section className="mx-auto max-w-7xl px-3 py-8 sm:px-4 sm:py-10 md:px-6 md:py-12">
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Hızlı Keşfet
              </h2>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Marka, şehir ve hazır filtrelerle doğru araca daha hızlı ulaşın.
              </p>
            </div>
            <Link
              href="/listings"
              prefetch={false}
              className="group flex items-center gap-1.5 text-sm font-semibold text-primary transition-all hover:text-primary/80"
            >
              Tüm İlanlar
              <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Popüler Markalar
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                {featuredBrands.map((brand) => (
                  <Link
                    key={brand.slug}
                    href={`/satilik/${brand.slug}`}
                    prefetch={false}
                    className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent hover:shadow-md sm:p-4"
                  >
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted/70 text-muted-foreground transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary">
                      <CarFront size={20} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                        {brand.brand}
                      </h4>
                      <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                        {brand.models.length} model
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Popüler Şehirler
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                {featuredCities.map((city) => (
                  <Link
                    key={city.slug}
                    href={`/satilik-araba/${city.slug}`}
                    prefetch={false}
                    className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent hover:shadow-md sm:p-4"
                  >
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted/70 text-muted-foreground transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary">
                      <MapPin size={20} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                        {city.city}
                      </h4>
                      <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                        {city.districts.length} ilçe
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {featuredListings.length > 0 && (
          <section className="bg-muted/30 py-8 sm:py-10 md:py-12">
            <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
              <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                    Anasayfa Vitrini
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm font-medium text-muted-foreground">
                    Bu alan, görünürlük satın alan ilanlar için ayrılmış premium vitrin yüzeyidir.
                    Sponsorlu görünürlük açıkça etiketlenir.
                  </p>
                </div>
                <Link
                  href="/listings"
                  prefetch={false}
                  className="group flex items-center gap-1.5 text-sm font-semibold text-primary transition-all hover:text-primary/80"
                >
                  Tüm İlanlar
                  <ChevronRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
                {featuredListings.map((listing, index) => (
                  <ListingCard key={listing.id} listing={listing} priority={index < 2} />
                ))}
              </div>
            </div>
          </section>
        )}

        {galleryListings.length > 0 && (
          <section className="mx-auto max-w-7xl px-3 py-8 sm:px-4 sm:py-10 md:px-6 md:py-12">
            <FeaturedCarousel listings={galleryListings} />
          </section>
        )}

        <section className="mx-auto max-w-7xl px-3 py-8 sm:px-4 sm:py-10 md:px-6 md:py-12">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Yeni İlanlar
            </h2>
            <Link
              href="/listings"
              prefetch={false}
              className="group flex items-center gap-1.5 text-sm font-semibold text-primary transition-all hover:text-primary/80"
            >
              Tüm İlanlar
              <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          {latestListings.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
              {latestListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-8 text-center sm:p-10">
              <CarFront size={40} className="mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="mb-2 text-lg font-bold text-card-foreground">Henüz ilan bulunmuyor</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                İlk ilanı sen vererek platformda yerini al.
              </p>
              <Link
                href="/dashboard/listings/create"
                prefetch={false}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Ücretsiz İlan Ver
              </Link>
            </div>
          )}
        </section>

        <section className="border-y border-border bg-muted/30 py-10 sm:py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
            <div className="mb-10 text-center sm:mb-14">
              <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                Güvenilir Araç Pazarı
              </h2>
              <p className="mx-auto max-w-2xl text-base text-muted-foreground">
                Tüm ilanlar moderasyondan geçer ve şeffaf fiyatlandırma ile sunulur. Hayalindeki
                araca güvenle ulaş.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
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
              ].map((item) => (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-border bg-card p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 sm:p-8"
                >
                  <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    {item.icon}
                  </div>
                  <h3 className="mb-3 text-lg font-bold text-card-foreground">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-background py-10 sm:py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
            <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="flex flex-col justify-center">
                <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                  Neden OtoBurada?
                </h2>
                <p className="mb-8 text-base text-muted-foreground">
                  OtoBurada ile ikinci el araba alım satım işlemlerinizi hızlı, şeffaf ve güvenli
                  bir şekilde gerçekleştirin. Sizi anlayan, modern bir pazaryeri deneyimi sunuyoruz.
                </p>
                <ul className="space-y-4">
                  {[
                    "Ücretsiz ilan verme ve anında onaya sunma imkanı",
                    "Uzman moderasyon ekibi ile güvenilir satıcı profilleri",
                    "Gelişmiş filtreleme ile doğru araca 3 adımda hızlı ulaşım",
                    "WhatsApp üzerinden anında, kesintisiz satıcı iletişimi",
                    "Mobil uyumlu, yüksek performanslı premium kullanıcı deneyimi",
                  ].map((benefit) => (
                    <li key={benefit} className="flex items-center gap-4 text-sm font-medium">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
                        <CheckCircle2 size={14} strokeWidth={3} />
                      </div>
                      <span className="leading-snug text-foreground/90">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <h3 className="mb-4 text-lg font-bold text-foreground">Popüler Arama</h3>
                <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    { href: "/listings?hasExpertReport=true", label: "Ekspertizli İlanlar" },
                    { href: "/listings?transmission=otomatik", label: "Otomatik Vites" },
                    {
                      href: "/listings?maxMileage=80000&sort=mileage_asc",
                      label: "Düşük Kilometre",
                    },
                    { href: "/listings?sort=newest", label: "En Yeni İlanlar" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
                      className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Markalar
                    </h4>
                    <ul className="space-y-2 text-sm">
                      {referencesData.brands.slice(0, 5).map((b) => (
                        <li key={b.slug}>
                          <Link
                            href={`/satilik/${b.slug}`}
                            prefetch={false}
                            className="text-muted-foreground transition-colors hover:text-primary"
                          >
                            {b.brand}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Şehirler
                    </h4>
                    <ul className="space-y-2 text-sm">
                      {referencesData.cities.slice(0, 5).map((c) => (
                        <li key={c.slug}>
                          <Link
                            href={`/satilik-araba/${c.slug}`}
                            prefetch={false}
                            className="text-muted-foreground transition-colors hover:text-primary"
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
