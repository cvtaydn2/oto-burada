import type { Metadata } from "next";

import { ListingsPageClient } from "@/components/listings/listings-page-client";
import {
  BreadcrumbStructuredData,
  ListingStructuredData,
  OrganizationStructuredData,
} from "@/components/seo/structured-data";
import { buildAbsoluteUrl, buildListingsMetadata } from "@/lib/seo";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseListingFiltersFromSearchParams } from "@/services/listings/listing-filters";
import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";
import { getLiveMarketplaceReferenceData } from "@/services/reference/live-reference-data";
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
  return buildListingsMetadata(filters);
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
