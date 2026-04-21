import {
  BreadcrumbStructuredData as CanonicalBreadcrumbStructuredData,
  ListingDetailStructuredData,
  OrganizationStructuredData as CanonicalOrganizationStructuredData,
} from "@/components/seo/structured-data";
import { buildAbsoluteUrl } from "@/lib/seo";
import type { Listing } from "@/types";

interface ListingJsonLdProps {
  listing: Listing;
}

export function ListingJsonLd({ listing }: ListingJsonLdProps) {
  return (
    <ListingDetailStructuredData
      listing={listing}
      url={buildAbsoluteUrl(`/listing/${listing.slug}`)}
      sellerName={listing.seller?.businessName ?? listing.seller?.fullName ?? undefined}
    />
  );
}

interface OrganizationJsonLdProps {
  url: string;
}

export function OrganizationJsonLd({ url }: OrganizationJsonLdProps) {
  return (
    <CanonicalOrganizationStructuredData
      name="Oto Burada"
      url={url}
      description="Türkiye'nin en güvenilir ikinci el araba alışveriş platformu. Ücretsiz ilan ver, güvenle al."
    />
  );
}

interface BreadcrumbJsonLdProps {
  items: Array<{ name: string; url: string }>;
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  return <CanonicalBreadcrumbStructuredData items={items} />;
}
