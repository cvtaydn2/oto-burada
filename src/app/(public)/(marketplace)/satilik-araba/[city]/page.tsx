import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BreadcrumbStructuredData, ListingStructuredData } from "@/components/seo/structured-data";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ListingsPageClient } from "@/features/marketplace/components/listings-page-client";
import { normalizeSlug } from "@/features/marketplace/lib/slugs";
import { getPublicMarketplaceListings } from "@/features/marketplace/services/marketplace-listings";
import { buildAbsoluteUrl, buildListingsMetadata } from "@/features/seo/lib";
import { getLiveMarketplaceReferenceData } from "@/features/shared/services/live-reference-data";
import type { ListingFilters } from "@/types";

interface CityPageProps {
  params: Promise<{
    city: string;
  }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { city: citySlug } = resolvedParams;

  const references = await getLiveMarketplaceReferenceData();
  const city = references.cities.find((c) => c.slug === citySlug)?.city ?? normalizeSlug(citySlug);

  const filters: ListingFilters = {
    city,
  };

  const metadata = buildListingsMetadata(filters);

  // Custom SEO-optimized title for City landing pages
  metadata.title = `${city} Satılık İkinci El Araba İlanları | OtoBurada`;
  metadata.description = `${city} genelindeki en güncel satılık ikinci el araba ilanlarını incele. ${city}'da uygun fiyatlı araçları keşfet, güvenle satın al veya sat.`;

  (metadata as Record<string, unknown>).alternates = {
    canonical: buildAbsoluteUrl(`/satilik-araba/${citySlug}`),
  };

  return metadata as Metadata;
}

export default async function CityPage({ params }: CityPageProps) {
  const resolvedParams = await params;
  const { city: citySlug } = resolvedParams;

  const references = await getLiveMarketplaceReferenceData();
  const city = references.cities.find((c) => c.slug === citySlug)?.city;

  if (!city) {
    notFound();
  }

  const initialFilters: ListingFilters = {
    city,
    sort: "newest",
  };

  const listings = await getPublicMarketplaceListings(initialFilters);

  const breadcrumbs = [
    { name: "Ana Sayfa", url: "/" },
    { name: "İlanlar", url: "/listings" },
    { name: `${city} İlanları`, url: `/satilik-araba/${citySlug}` },
  ];

  return (
    <>
      <BreadcrumbStructuredData
        items={breadcrumbs.map((b) => ({ name: b.name, url: buildAbsoluteUrl(b.url) }))}
      />
      <ListingStructuredData
        listings={listings.listings.filter((l) => l.city === city)}
        url={buildAbsoluteUrl(`/satilik-araba/${citySlug}`)}
      />

      <div className="bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs items={breadcrumbs.slice(1)} />
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {city} Satılık İkinci El Araba İlanları
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl font-medium leading-relaxed">
            {city} genelindeki tüm güncel araba ilanlarını keşfet. {city}&apos;da kriterlerine ve
            bütçene en uygun ikinci el aracı OtoBurada güvencesiyle hemen bul.
          </p>
        </div>
      </div>

      <ListingsPageClient
        initialResult={listings}
        brands={references.brands}
        cities={references.cities}
        initialFilters={initialFilters}
      />
    </>
  );
}
