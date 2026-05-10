import type { Metadata } from "next";

import {
  BreadcrumbStructuredData,
  ListingStructuredData,
  OrganizationStructuredData,
} from "@/components/seo/structured-data";
import { ListingsPageClient } from "@/features/marketplace/components/listings-page-client";
import { parseListingFiltersFromSearchParams } from "@/features/marketplace/services/listing-filters";
import { getPublicMarketplaceListings } from "@/features/marketplace/services/marketplace-listings";
import {
  buildMarketplaceFilterState,
  canonicalizeMarketplaceFilters,
} from "@/features/marketplace/services/marketplace-query";
import { buildAbsoluteUrl, buildListingsMetadata } from "@/features/seo/lib";
import { getLiveMarketplaceReferenceData } from "@/features/shared/services/live-reference-data";
import { createSupabaseServerClient } from "@/lib/server";

export const revalidate = 3600;

interface ListingsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: ListingsPageProps): Promise<Metadata> {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const rawFilters = parseListingFiltersFromSearchParams(resolvedSearchParams);
  const query = canonicalizeMarketplaceFilters(rawFilters);
  return buildListingsMetadata(query as unknown as Record<string, unknown>);
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const [references, { data: authData }] = await Promise.all([
    getLiveMarketplaceReferenceData(),
    (await createSupabaseServerClient()).auth.getUser(),
  ]);

  const user = authData?.user;

  const rawFilters = parseListingFiltersFromSearchParams(resolvedSearchParams);
  const initialQuery = canonicalizeMarketplaceFilters(rawFilters, {
    brands: references.brands,
    cities: references.cities,
  });

  const initialFilters = buildMarketplaceFilterState({
    rawFilters,
    query: initialQuery,
    brands: references.brands,
    cities: references.cities,
  });

  const result = await getPublicMarketplaceListings(initialQuery);

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
          initialQuery={initialQuery}
          userId={user?.id}
        />
      </div>
    </>
  );
}
