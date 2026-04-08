"use client";

import type { Listing } from "@/types";

interface ListingJsonLdProps {
  listing: Listing;
}

export function ListingJsonLd({ listing }: ListingJsonLdProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description,
    image: listing.images.map((img) => img.url),
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "TRY",
      availability: listing.status === "approved" 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/UsedCondition",
    },
    brand: {
      "@type": "Brand",
      name: listing.brand,
    },
    vehicleModel: {
      "@type": "Car",
      name: listing.model,
      vehicleYear: listing.year,
      mileageFromOdometer: {
        "@type": "QuantitativeValue",
        value: listing.mileage,
        unitCode: "KMT",
      },
      fuelType: listing.fuelType,
      transmission: listing.transmission,
    },
    seller: {
      "@type": "Organization",
      name: "Oto Burada",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface OrganizationJsonLdProps {
  url: string;
}

export function OrganizationJsonLd({ url }: OrganizationJsonLdProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Oto Burada",
    url,
    logo: `${url}/logo.png`,
    description: "Türkiye'nin en güvenilir ikinci el araba alışveriş platformu. Ücretsiz ilan ver, güvenle al.",
    sameAs: [
      "https://instagram.com/otoburada",
      "https://twitter.com/otoburada",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: "Turkish",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface BreadcrumbJsonLdProps {
  items: Array<{ name: string; url: string }>;
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
