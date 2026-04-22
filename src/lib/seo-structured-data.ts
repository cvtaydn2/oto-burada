import { buildAbsoluteUrl } from "@/lib/seo";
import type { Listing } from "@/types";

export function buildVehicleJsonLd(listing: Listing) {
  const coverImage = listing.images.find((img) => img.isCover) ?? listing.images[0];

  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: listing.title,
    description: listing.description?.slice(0, 500),
    brand: { "@type": "Brand", name: listing.brand },
    model: listing.model,
    modelDate: String(listing.year),
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: listing.mileage,
      unitCode: "KMT",
    },
    fuelType: listing.fuelType,
    vehicleTransmission: listing.transmission,
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "TRY",
      availability: "https://schema.org/InStock",
      url: buildAbsoluteUrl(`/listing/${listing.slug}`),
      seller: {
        "@type": "Person",
        name: listing.city,
      },
    },
    image: coverImage?.url,
    url: buildAbsoluteUrl(`/listing/${listing.slug}`),
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Oto Burada",
    url: buildAbsoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${buildAbsoluteUrl("/listings")}?query={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
