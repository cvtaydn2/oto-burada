import type { Metadata } from "next";

import { AdvancedFilterPage } from "@/features/marketplace/components/advanced-filter-page";
import { getFilteredMarketplaceListings } from "@/features/marketplace/services/marketplace-listings";
import { getLiveMarketplaceReferenceData } from "@/features/shared/services/live-reference-data";
import type { BrandCatalogItem, CityOption, ListingFilters } from "@/types";

function resolveBrandSlugToName(brands: BrandCatalogItem[], slug: string): string | undefined {
  const match = brands.find((b) => b.slug.toLowerCase() === slug.toLowerCase());
  return match?.brand;
}

function resolveCitySlugToName(cities: CityOption[], slug: string): string | undefined {
  const match = cities.find((c) => c.slug.toLowerCase() === slug.toLowerCase());
  return match?.city;
}

export const metadata: Metadata = {
  title: "Gelişmiş Filtreleme | OtoBurada",
  description: "Detaylı kriterlerle hayalinizdeki aracı bulun.",
};

interface FilterPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ListingsFilterPage({ searchParams }: FilterPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;

  const [references, result] = await Promise.all([
    getLiveMarketplaceReferenceData(),
    getFilteredMarketplaceListings({ sort: "newest", page: 1, limit: 1 }),
  ]);

  const brandSlug = resolvedParams?.brand;
  const citySlug = resolvedParams?.city;
  const initialFilters: ListingFilters = {
    sort: "newest",
    page: 1,
    limit: 12,
    ...(brandSlug ? { brand: resolveBrandSlugToName(references.brands, String(brandSlug)) } : {}),
    ...(citySlug ? { city: resolveCitySlugToName(references.cities, String(citySlug)) } : {}),
    ...(resolvedParams?.query ? { query: String(resolvedParams.query) } : {}),
    ...(resolvedParams?.model ? { model: String(resolvedParams.model) } : {}),
    ...(resolvedParams?.minPrice ? { minPrice: Number(resolvedParams.minPrice) } : {}),
    ...(resolvedParams?.maxPrice ? { maxPrice: Number(resolvedParams.maxPrice) } : {}),
    ...(resolvedParams?.minYear ? { minYear: Number(resolvedParams.minYear) } : {}),
    ...(resolvedParams?.maxYear ? { maxYear: Number(resolvedParams.maxYear) } : {}),
    ...(resolvedParams?.fuelType ? { fuelType: String(resolvedParams.fuelType) } : {}),
    ...(resolvedParams?.transmission ? { transmission: String(resolvedParams.transmission) } : {}),
    ...(resolvedParams?.hasExpertReport ? { hasExpertReport: true } : {}),
  };

  return (
    <AdvancedFilterPage
      brands={references.brands}
      cities={references.cities}
      initialFilters={initialFilters}
      totalCount={result.total}
    />
  );
}
