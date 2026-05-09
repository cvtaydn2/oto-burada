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
import { getPublicMarketplaceListings } from "@/features/marketplace/services/marketplace-listings";
import { getAppUrl } from "@/features/seo/lib";
import { getLiveMarketplaceReferenceData } from "@/features/shared/services/live-reference-data";

const FeaturedCarousel = dynamic(
  () =>
    import("@/features/marketplace/components/featured-carousel").then(
      (mod) => mod.FeaturedCarousel
    ),
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
    // PERF: Homepage renders only 8 "latest" cards after de-duplication.
    // Lowering source query size reduces DB payload and TTFB without UX loss.
    getPublicMarketplaceListings({ limit: 12, sort: "newest" }),
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

          <QuickExplore brands={featuredBrands} cities={featuredCities} />
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

        <HomeTrustAndSearch brands={referencesData.brands} cities={referencesData.cities} />
      </main>
    </div>
  );
}
