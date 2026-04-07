import type { Listing } from "@/types";

interface ListingStructuredDataProps {
  listings: Listing[];
  url: string;
}

export function ListingStructuredData({ listings, url }: ListingStructuredDataProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "OtoBurada - İkinci El ve Sıfır Araç İlanları",
    "description": "Türkiye'nin en güvenilir 2. el ve sıfır otomobil pazarı. Binlerce araç içinden hayalindeki arabayı bul.",
    "url": url,
    "numberOfItems": listings.length,
    "itemListElement": listings.slice(0, 10).map((listing, index) => ({
      "@type": "Offer",
      "position": index + 1,
      "name": `${listing.brand} ${listing.model} - ${listing.title}`,
      "description": `${listing.year} model, ${listing.mileage.toLocaleString()} km, ${listing.fuelType}, ${listing.transmission}`,
      "price": listing.price,
      "priceCurrency": "TRY",
      "availability": "https://schema.org/InStock",
      "url": `${url}/listing/${listing.slug}`,
      "image": listing.images[0]?.url,
      "seller": {
        "@type": "Organization",
        "name": "OtoBurada"
      },
      "address": {
        "@type": "PostalAddress",
        "addressLocality": listing.city,
        "addressCountry": "TR"
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbStructuredDataProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  const itemListElement = items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }));
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": itemListElement
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface OrganizationStructuredDataProps {
  name: string;
  url: string;
  logo?: string;
  description: string;
}

export function OrganizationStructuredData({ name, url, logo, description }: OrganizationStructuredDataProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": name,
    "url": url,
    "logo": logo,
    "description": description,
    "sameAs": [],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": "Turkish"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ListingDetailStructuredDataProps {
  listing: Listing;
  url: string;
}

export function ListingDetailStructuredData({ listing, url }: ListingDetailStructuredDataProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    "name": `${listing.brand} ${listing.model}`,
    "description": listing.description,
    "brand": {
      "@type": "Brand",
      "name": listing.brand
    },
    "model": listing.model,
    "productionDate": listing.year.toString(),
    "mileageFromOdometer": {
      "@type": "QuantitativeValue",
      "value": listing.mileage,
      "unitCode": "KM"
    },
    "fuelType": listing.fuelType,
    "vehicleTransmission": listing.transmission,
    "offers": {
      "@type": "Offer",
      "price": listing.price,
      "priceCurrency": "TRY",
      "availability": "https://schema.org/InStock",
      "url": url,
      "seller": {
        "@type": "Person",
        "name": "Satıcı"
      }
    },
    "image": listing.images.map(img => img.url)
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}