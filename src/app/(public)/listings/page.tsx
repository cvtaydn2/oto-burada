import type { Metadata } from "next";

import { ListingsPageClient } from "@/components/listings/listings-page-client";
import { ListingStructuredData, OrganizationStructuredData, BreadcrumbStructuredData } from "@/components/seo/structured-data";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { getCurrentUser } from "@/lib/auth/session";
import { buildListingsMetadata, buildAbsoluteUrl } from "@/lib/seo";
import { parseListingFiltersFromSearchParams } from "@/services/listings/listing-filters";
import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";
import { getLiveMarketplaceReferenceData } from "@/services/reference/live-reference-data";

export const dynamic = "force-dynamic";
export const revalidate = 60;

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

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialFilters = parseListingFiltersFromSearchParams(resolvedSearchParams);
  const initialFiltersKey = JSON.stringify(initialFilters);
  const [currentUser, listings, references] = await Promise.all([
    getCurrentUser(),
    getPublicMarketplaceListings(),
    getLiveMarketplaceReferenceData(),
  ]);

  const breadcrumbs = [
    { name: "Tüm İlanlar", url: "/listings" }
  ];

  return (
    <>
      <OrganizationStructuredData 
        name="OtoBurada"
        url={buildAbsoluteUrl("/")}
        description="Türkiye'nin en güvenilir 2. el ve sıfır otomobil pazarı. Binlerce araç içinden hayalindeki arabayı bul."
      />
      <BreadcrumbStructuredData items={breadcrumbs.map(b => ({ name: b.name, url: buildAbsoluteUrl(b.url) }))} />
      <ListingStructuredData listings={listings} url={buildAbsoluteUrl("/listings")} />
      
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      </div>

      <ListingsPageClient
        key={initialFiltersKey}
        listings={listings}
        brands={references.brands}
        cities={references.cities}
        initialFilters={initialFilters}
        userId={currentUser?.id}
      />
    </>
  );
}
