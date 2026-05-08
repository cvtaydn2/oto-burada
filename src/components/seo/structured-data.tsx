import type { Listing } from "@/types";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbStructuredDataProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
          })),
        }),
      }}
    />
  );
}

interface ListingStructuredDataProps {
  listings: Listing[];
  url: string;
}

export function ListingStructuredData({ listings, url }: ListingStructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: listings.map((listing, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${url}/listing/${listing.slug}`,
            name: `${listing.brand} ${listing.model} ${listing.year}`,
          })),
        }),
      }}
    />
  );
}

interface ListingDetailStructuredDataProps {
  listing: Listing;
  url: string;
  sellerName?: string;
}

export function ListingDetailStructuredData({
  listing,
  url,
  sellerName,
}: ListingDetailStructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: `${listing.brand} ${listing.model} ${listing.year}`,
          description: listing.description || undefined,
          image: listing.images?.[0] || undefined,
          offers: {
            "@type": "Offer",
            price: listing.price,
            priceCurrency: "TRY",
            availability: "https://schema.org/InStock",
            seller: sellerName ? { "@type": "Organization", name: sellerName } : undefined,
          },
          url: `${url}/listing/${listing.slug}`,
        }),
      }}
    />
  );
}

interface OrganizationStructuredDataProps {
  name: string;
  url: string;
  description: string;
}

export function OrganizationStructuredData({
  name,
  url,
  description,
}: OrganizationStructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name,
          url,
          logo: `${url}/logo.png`,
          description,
          sameAs: ["https://www.instagram.com/otoburada/", "https://www.facebook.com/otoburada/"],
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+90-850-XXX-XXXX",
            contactType: "customer service",
            availableLanguage: "Turkish",
          },
        }),
      }}
    />
  );
}

interface WebSiteStructuredDataProps {
  url: string;
}

export function WebSiteStructuredData({ url }: WebSiteStructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "OtoBurada",
          url,
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${url}/listings?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        }),
      }}
    />
  );
}

export function buildAbsoluteUrl(path: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://otoburada.com";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export function buildListingsMetadata(_filters?: Record<string, unknown>) {
  if (_filters) {
  }
  return {
    title: "Satılık Arabalar - Türkiye'nin En Büyük Araç İlan Pazarı",
    description:
      "Türkiye'nin en güvenilir satılık araba ilanları. Binlerce satılık araç ilanı, en uygun fiyatlar ve güvenli alışveriş.",
    url: buildAbsoluteUrl("/listings"),
  };
}

export function buildListingDetailMetadata(listing: Listing) {
  return {
    title: `${listing.brand} ${listing.model} - Satılık | OtoBurada`,
    description: `${listing.brand} ${listing.model} ${listing.year} satılık ilanı. ${listing.price ? `${listing.price.toLocaleString("tr-TR")} TL` : ""}`,
    url: buildAbsoluteUrl(`/listing/${listing.slug}`),
  };
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://otoburada.com";
}
