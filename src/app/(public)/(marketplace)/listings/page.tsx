import type { Metadata } from "next";

import {
  BreadcrumbStructuredData,
  ListingStructuredData,
  OrganizationStructuredData,
} from "@/components/seo/structured-data";
import { ListingsPageClient } from "@/features/marketplace/components/listings-page-client";
import { parseListingFiltersFromSearchParams } from "@/features/marketplace/services/listing-filters";
import { getPublicMarketplaceListings } from "@/features/marketplace/services/marketplace-listings";
import { buildAbsoluteUrl, buildListingsMetadata } from "@/features/seo/lib";
import { getLiveMarketplaceReferenceData } from "@/features/shared/services/live-reference-data";
import { createSupabaseServerClient } from "@/lib/server";
import type { BrandCatalogItem, CityOption, ListingFilters } from "@/types";

function resolveBrandSlugToName(brands: BrandCatalogItem[], slug: string): string | undefined {
  const match = brands.find((b) => b.slug.toLowerCase() === slug.toLowerCase());
  return match?.brand;
}

function resolveCitySlugToName(cities: CityOption[], slug: string): string | undefined {
  const match = cities.find((c) => c.slug.toLowerCase() === slug.toLowerCase());
  return match?.city;
}

export const revalidate = 3600;

interface ListingsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: ListingsPageProps): Promise<Metadata> {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const filters = parseListingFiltersFromSearchParams(resolvedSearchParams);
  return buildListingsMetadata(filters as unknown as Record<string, unknown>);
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const [references, { data: authData }] = await Promise.all([
    getLiveMarketplaceReferenceData(),
    (await createSupabaseServerClient()).auth.getUser(),
  ]);
  const user = authData?.user;

  const parsedFilters = parseListingFiltersFromSearchParams(resolvedSearchParams);
  const brandSlug = resolvedSearchParams?.brand;
  const citySlug = resolvedSearchParams?.city;

  const initialFilters: ListingFilters = {
    ...parsedFilters,
    ...(brandSlug ? { brand: resolveBrandSlugToName(references.brands, String(brandSlug)) } : {}),
    ...(citySlug ? { city: resolveCitySlugToName(references.cities, String(citySlug)) } : {}),
  };

  const result = await getPublicMarketplaceListings(initialFilters);

  const breadcrumbs = [{ name: "Tüm İlanlar", url: "/listings" }];

  return (
    <>
      <OrganizationStructuredData
        name="OtoBurada"
        url={buildAbsoluteUrl("/")}
        description="Türkiye'nin en güvenilir 2. el ve sıfır otomobil pazarı. Binlerce araç içinden hayalindeki arabayı bul."
      />
      <BreadcrumbStructuredData
        items={breadcrumbs.map((b) => ({ name: b.name, url: buildAbsoluteUrl(b.url) }))}
      />
      <ListingStructuredData listings={result.listings} url={buildAbsoluteUrl("/listings")} />

      <div className="min-h-screen bg-muted/30">
        <ListingsPageClient
          initialResult={result}
          brands={references.brands}
          cities={references.cities}
          initialFilters={initialFilters}
          userId={user?.id}
        />
      </div>
    </>
  );
}
