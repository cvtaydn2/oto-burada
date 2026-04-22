import type { Metadata } from "next";

import { AdvancedFilterPage } from "@/components/listings/advanced-filter-page";
import { parseListingFiltersFromSearchParams } from "@/services/listings/listing-filters";
import { getFilteredMarketplaceListings } from "@/services/listings/marketplace-listings";
import { getLiveMarketplaceReferenceData } from "@/services/reference/live-reference-data";

export const metadata: Metadata = {
  title: "Gelişmiş Filtreleme | OtoBurada",
  description: "Detaylı kriterlerle hayalinizdeki aracı bulun.",
};

interface FilterPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ListingsFilterPage({ searchParams }: FilterPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const initialFilters = parseListingFiltersFromSearchParams(resolvedParams);

  const [references, result] = await Promise.all([
    getLiveMarketplaceReferenceData(),
    getFilteredMarketplaceListings({ ...initialFilters, limit: 1 }), // sadece total için
  ]);

  return (
    <AdvancedFilterPage
      brands={references.brands}
      cities={references.cities}
      initialFilters={initialFilters}
      totalCount={result.total}
    />
  );
}
