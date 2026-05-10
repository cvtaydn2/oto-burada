import { CarFront, ChevronRight } from "lucide-react";
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
import { HomeTrustAndSearch } from "@/features/marketplace/components/home-trust-and-search";
import { QuickExplore } from "@/features/marketplace/components/quick-explore";
import { getMarketplaceHomepageViewModel } from "@/features/marketplace/services/homepage-view-model";
import { getAppUrl } from "@/features/seo/lib";

const FeaturedCarousel = dynamic(
  () =>
    import("@/features/marketplace/components/featured-carousel").then(
      (mod) => mod.FeaturedCarousel
    ),
  {
    loading: () => (
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 h-6 w-44 animate-pulse rounded bg-muted/40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-[360px] animate-pulse rounded-2xl bg-muted/30" />
          ))}
        </div>
      </div>
    ),
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
  const {
    featuredListings,
    galleryListings,
    latestListings,
    brands,
    cities,
    heroCities,
    searchSuggestions,
    results,
  } = await getMarketplaceHomepageViewModel();

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
        <HomeErrorHandler results={results} />

        <HomeHero cities={heroCities} searchSuggestions={searchSuggestions} />

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

          <QuickExplore brands={brands.slice(0, 6)} cities={cities.slice(0, 6)} />
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
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Yeni İlanlar
              </h2>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                En son yayınlanan, moderasyondan geçmiş güncel araç ilanları.
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

          {latestListings.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
              {latestListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-8 text-center sm:p-10">
              <CarFront size={40} className="mx-auto text-primary/80" />
              <h3 className="mt-4 text-lg font-bold text-foreground sm:text-xl">
                Henüz gösterilecek yeni ilan yok
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-muted-foreground">
                Çok yakında yeni araç ilanları burada görünecek. Dilersen tüm ilanlara giderek
                mevcut sonuçları inceleyebilirsin.
              </p>
              <div className="mt-6">
                <Link
                  href="/listings"
                  prefetch={false}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Tüm İlanlara Git
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          )}
        </section>

        <HomeTrustAndSearch brands={brands} cities={cities} />
      </main>
    </div>
  );
}
