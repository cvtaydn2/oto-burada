import type { Metadata } from "next";

import { ListingsPageClient } from "@/components/listings/listings-page-client";
import { ListingStructuredData, OrganizationStructuredData, BreadcrumbStructuredData } from "@/components/seo/structured-data";
import { buildListingsMetadata, buildAbsoluteUrl } from "@/lib/seo";
import { parseListingFiltersFromSearchParams } from "@/services/listings/listing-filters";
import { getFilteredMarketplaceListings } from "@/services/listings/marketplace-listings";
import { getLiveMarketplaceReferenceData } from "@/services/reference/live-reference-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Arama ve filtreleme sayfasında güncel veriyi göstermek için 1 saatlik revalidation kullanıyoruz.
// force-dynamic yerine ISR ile hem SEO hem performans kazanıyoruz.
export const revalidate = 3600;

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
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [result, references] = await Promise.all([
    getFilteredMarketplaceListings(initialFilters),
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
