import Link from "next/link";
import type { Metadata } from "next";

import { ListingsPageClient } from "@/components/listings/listings-page-client";
import { ListingStructuredData, OrganizationStructuredData, BreadcrumbStructuredData } from "@/components/seo/structured-data";
import { getCurrentUser } from "@/lib/auth/session";
import { buildListingsMetadata, buildAbsoluteUrl } from "@/lib/seo";
import { parseListingFiltersFromSearchParams } from "@/services/listings/listing-filters";
import { getFilteredMarketplaceListings } from "@/services/listings/marketplace-listings";
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
  const [currentUser, result, references] = await Promise.all([
    getCurrentUser(),
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
      
      <div className="bg-[#FDFDFF] min-h-screen">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-24 pb-6 border-b border-slate-100 bg-white">
           <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-6">
             <Link href="/" className="hover:text-primary transition-colors">Ana Sayfa</Link>
             <span>/</span>
             <span className="text-slate-900">Otomobil İlanları</span>
           </nav>
        </div>

        <ListingsPageClient
          initialResult={result}
          brands={references.brands}
          cities={references.cities}
          initialFilters={initialFilters}
          userId={currentUser?.id}
        />
      </div>
    </>
  );
}
