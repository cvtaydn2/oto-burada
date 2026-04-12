import type { Metadata } from "next";

import { createSearchParamsFromListingFilters } from "@/services/listings/listing-filters";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { sanitizeForMeta } from "@/lib/utils/sanitize";
import type { Listing, ListingFilters } from "@/types";

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function buildAbsoluteUrl(path: string) {
  return new URL(path, getAppUrl()).toString();
}

export function buildListingsMetadata(filters: ListingFilters): Metadata {
  const segments: string[] = [];

  if (filters.brand) {
    segments.push(filters.brand);
  }

  if (filters.model) {
    segments.push(filters.model);
  }

  if (filters.city) {
    segments.push(filters.city);
  }

  if (filters.transmission) {
    segments.push(filters.transmission);
  }

  if (filters.fuelType) {
    segments.push(filters.fuelType);
  }

  const title =
    segments.length > 0 ? `${segments.join(" ")} araba ilanları` : "Araba ilanları";

  const descriptionParts = [
    "Marka, model, şehir, fiyat ve teknik özelliklere göre filtrelenebilen sade araba ilan listesi.",
  ];

  if (filters.maxPrice !== undefined) {
    descriptionParts.push(`Maksimum fiyat ${formatCurrency(filters.maxPrice)}.`);
  }

  if (filters.maxMileage !== undefined) {
    descriptionParts.push(`Maksimum kilometre ${formatNumber(filters.maxMileage)} km.`);
  }

  // SEO Fix: Canonical should point to the most specific "Page" (Brand/City), 
  // not to every single filter permutation which creates duplicate content.
  let canonicalPath = "/listings";
  if (filters.brand && !filters.city) canonicalPath = `/satilik/${filters.brand.toLowerCase()}`;
  else if (filters.brand && filters.city) canonicalPath = `/satilik/${filters.brand.toLowerCase()}/${filters.city.toLowerCase()}`;

  return {
    title,
    description: descriptionParts.join(" "),
    alternates: {
      canonical: buildAbsoluteUrl(canonicalPath),
    },
    openGraph: {
      description: descriptionParts.join(" "),
      title: `${title} | Oto Burada`,
      type: "website",
      url: buildAbsoluteUrl(canonicalPath),
    },
  };
}

export function buildListingDetailMetadata(listing: Listing): Metadata {
  const title = sanitizeForMeta(`${listing.title} - ${formatCurrency(listing.price)}`);
  const description = sanitizeForMeta([
    `${listing.city}/${listing.district} konumunda ${listing.year} model ${listing.brand} ${listing.model}.`,
    `${formatNumber(listing.mileage)} km, ${listing.fuelType}, ${listing.transmission}.`,
    listing.description,
  ]
    .join(" ")
    .slice(0, 320));

  return {
    title,
    description,
    alternates: {
      canonical: buildAbsoluteUrl(`/listing/${listing.slug}`),
    },
    openGraph: {
      description,
      images: [buildAbsoluteUrl(`/api/og/listing?slug=${listing.slug}`)],
      title: `${title} | Oto Burada`,
      type: "article",
      url: buildAbsoluteUrl(`/listing/${listing.slug}`),
      siteName: "Oto Burada",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Oto Burada`,
      description,
      images: [buildAbsoluteUrl(`/api/og/listing?slug=${listing.slug}`)],
    },
  };
}

