import type { Metadata } from "next";

import { ListingsPageClient } from "@/components/listings/listings-page-client";
import { brandCatalog, cityOptions } from "@/data";
import { buildListingsMetadata } from "@/lib/seo";
import { parseListingFiltersFromSearchParams } from "@/services/listings/listing-filters";
import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";

interface ListingsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  searchParams,
}: ListingsPageProps): Promise<Metadata> {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const filters = parseListingFiltersFromSearchParams(resolvedSearchParams);

  return buildListingsMetadata(filters);
}

export default async function HomePage({ searchParams }: ListingsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialFilters = parseListingFiltersFromSearchParams(resolvedSearchParams);
  const initialFiltersKey = JSON.stringify(initialFilters);
  const listings = await getPublicMarketplaceListings();

  return (
    <ListingsPageClient
      key={initialFiltersKey}
      listings={listings}
      brands={brandCatalog}
      cities={cityOptions}
      initialFilters={initialFilters}
    />
  );
}
