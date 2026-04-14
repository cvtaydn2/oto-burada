import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingsPageClient } from "@/components/listings/listings-page-client";
import { ListingStructuredData, BreadcrumbStructuredData } from "@/components/seo/structured-data";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { buildListingsMetadata, buildAbsoluteUrl } from "@/lib/seo";
import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";
import { getLiveMarketplaceReferenceData } from "@/services/reference/live-reference-data";
import type { ListingFilters } from "@/types";

interface LandingPageProps {
  params: Promise<{
    brand: string;
    city?: string[];
  }>;
}

function normalizeSlug(slug: string) {
  return slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();
}

export async function generateMetadata({ params }: LandingPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { brand: brandSlug, city: cityParts } = resolvedParams;
  const citySlug = cityParts?.[0];

  const references = await getLiveMarketplaceReferenceData();
  
  const brand = references.brands.find(b => b.brand.toLowerCase() === brandSlug.toLowerCase())?.brand ?? normalizeSlug(brandSlug);
  const city = citySlug ? (references.cities.find(c => c.city.toLowerCase() === citySlug.toLowerCase())?.city ?? normalizeSlug(citySlug)) : undefined;

  const filters: ListingFilters = {
    brand,
    city,
  };

  const metadata = buildListingsMetadata(filters);
  
  // Custom title for landing pages
  const locationText = city ? `${city} ilinde ` : "";
  metadata.title = `Satılık ${locationText}${brand} İlanları - İkinci El ${brand} Fiyatları`;
  metadata.description = `${city ?? "Türkiye"} genelindeki güncel satılık ${brand} ilanlarını incele. En uygun fiyatlı ikinci el ${brand} modelleri OtoBurada'da.`;
  
  if (metadata.alternates) {
    metadata.alternates.canonical = buildAbsoluteUrl(`/satilik/${brandSlug}${citySlug ? `/${citySlug}` : ""}`);
  }

  return metadata;
}

export default async function LandingPage({ params }: LandingPageProps) {
  const resolvedParams = await params;
  const { brand: brandSlug, city: cityParts } = resolvedParams;
  const citySlug = cityParts?.[0];

  const references = await getLiveMarketplaceReferenceData();
  const brand = references.brands.find(b => b.brand.toLowerCase() === brandSlug.toLowerCase())?.brand;
  
  if (!brand) {
    notFound();
  }

  const city = citySlug ? references.cities.find(c => c.city.toLowerCase() === citySlug.toLowerCase())?.city : undefined;

  const initialFilters: ListingFilters = {
    brand,
    city,
    sort: "newest",
  };

  const listings = await getPublicMarketplaceListings(initialFilters);

  const breadcrumbs = [
    { name: "Ana Sayfa", url: "/" },
    { name: "İlanlar", url: "/listings" },
    { name: `${brand} İlanları`, url: `/satilik/${brandSlug}` },
  ];

  if (city) {
    breadcrumbs.push({ name: `${city} ${brand}`, url: `/satilik/${brandSlug}/${citySlug}` });
  }

  return (
    <>
      <BreadcrumbStructuredData items={breadcrumbs.map(b => ({ name: b.name, url: buildAbsoluteUrl(b.url) }))} />
      <ListingStructuredData 
        listings={listings.listings.filter(l => l.brand === brand && (!city || l.city === city))} 
        url={buildAbsoluteUrl(`/satilik/${brandSlug}${citySlug ? `/${citySlug}` : ""}`)} 
      />
      
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs items={breadcrumbs.slice(1)} />
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Satılık {city ? `${city} ` : ""}{brand} İlanları
          </h1>
          <p className="mt-4 text-lg text-slate-500 max-w-3xl">
            {city ?? "Türkiye"} genelindeki en güncel {brand} ilanlarını keşfet. {brand} modelleri arasından bütçene ve kriterlerine en uygun olanı hemen bul.
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
