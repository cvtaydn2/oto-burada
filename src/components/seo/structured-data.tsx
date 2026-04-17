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
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Car",
        "name": listing.title,
        "description": `${listing.year} model, ${listing.mileage.toLocaleString("tr-TR")} km, ${listing.fuelType}, ${listing.transmission}`,
        "brand": { "@type": "Brand", "name": listing.brand },
        "model": listing.model,
        "modelDate": listing.year.toString(),
        "mileageFromOdometer": {
          "@type": "QuantitativeValue",
          "value": listing.mileage,
          "unitCode": "KMT",
        },
        "image": listing.images[0]?.url,
        "url": `${url}/listing/${listing.slug}`,
        "offers": {
          "@type": "Offer",
          "price": listing.price,
          "priceCurrency": "TRY",
          "availability": "https://schema.org/InStock",
          "url": `${url}/listing/${listing.slug}`,
        },
        "availableAtOrFrom": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": listing.city,
            "addressCountry": "TR",
          },
        },
      },
    })),
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
  sellerName?: string;
}

export function ListingDetailStructuredData({ listing, url, sellerName }: ListingDetailStructuredDataProps) {
  const coverImage = listing.images.find(img => img.isCover) ?? listing.images[0];
  const allImageUrls = listing.images.map(img => img.url).filter(Boolean);

  // Map Turkish fuel types to schema.org values
  const fuelTypeMap: Record<string, string> = {
    benzin: "Gasoline",
    dizel: "Diesel",
    lpg: "LPG",
    hibrit: "Hybrid",
    elektrik: "Electric",
  };

  // Map Turkish transmission types to schema.org values
  const transmissionMap: Record<string, string> = {
    manuel: "ManualTransmission",
    otomatik: "AutomaticTransmission",
    yari_otomatik: "SemiAutomaticTransmission",
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "Car",
    "name": listing.title,
    "description": listing.description,
    "url": url,
    "brand": {
      "@type": "Brand",
      "name": listing.brand,
    },
    "model": listing.model,
    ...(listing.carTrim ? { "vehicleModelDate": listing.carTrim } : {}),
    "modelDate": listing.year.toString(),
    "productionDate": listing.year.toString(),
    "vehicleModelDate": listing.year.toString(),
    "mileageFromOdometer": {
      "@type": "QuantitativeValue",
      "value": listing.mileage,
      "unitCode": "KMT",
      "unitText": "km",
    },
    "fuelType": fuelTypeMap[listing.fuelType] ?? listing.fuelType,
    "vehicleTransmission": transmissionMap[listing.transmission] ?? listing.transmission,
    ...(listing.vin ? { "vehicleIdentificationNumber": listing.vin } : {}),
    "itemCondition": "https://schema.org/UsedCondition",
    "image": allImageUrls.length > 0 ? allImageUrls : undefined,
    "thumbnail": coverImage?.url,
    "offers": {
      "@type": "Offer",
      "price": listing.price,
      "priceCurrency": "TRY",
      "availability": "https://schema.org/InStock",
      "url": url,
      "priceValidUntil": new Date(listing.updatedAt).toISOString().split("T")[0],
      "seller": {
        "@type": sellerName ? "Person" : "Organization",
        "name": sellerName ?? "OtoBurada",
      },
    },
    "seller": {
      "@type": sellerName ? "Person" : "Organization",
      "name": sellerName ?? "OtoBurada",
    },
    "availableAtOrFrom": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": listing.city,
        "addressRegion": listing.district,
        "addressCountry": "TR",
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface WebSiteStructuredDataProps {
  url: string;
}

export function WebSiteStructuredData({ url }: WebSiteStructuredDataProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "OtoBurada",
    "url": url,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${url}/listings?query={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}