import { captureServerEvent } from "@/lib/monitoring/posthog-server";
import { withNextCache } from "@/lib/utils/cache";
import { maskPhoneNumber } from "@/lib/utils/listing-utils";
import { logger } from "@/lib/utils/logger";
import { getPublicListings } from "@/services/listings/catalog";
import { createExpertDocumentSignedUrl } from "@/services/listings/listing-documents";
import {
  getStoredListingById,
  getStoredListingBySlug,
  getStoredListingsByIds,
  type PaginatedListingsResult,
} from "@/services/listings/listing-submissions";
import { getPublicSellerProfile } from "@/services/profile/profile-records";
import type { Listing, ListingFilters, Profile } from "@/types";

export {
  getStoredListingById,
  getStoredListingBySlug,
  getStoredListingsByIds,
  type PaginatedListingsResult,
};

const SUPPORTED_MARKETPLACE_FILTER_KEYS = new Set<keyof ListingFilters>([
  "brand",
  "model",
  "carTrim",
  "city",
  "district",
  "fuelType",
  "transmission",
  "minPrice",
  "maxPrice",
  "minYear",
  "maxYear",
  "maxMileage",
  "hasExpertReport",
  "maxTramer",
  "query",
  "sort",
  "page",
  "limit",
  "citySlug",
  "sellerId",
  "cursor",
  "isExchange",
]);

function sanitizeMarketplaceFilters(filters: ListingFilters): ListingFilters {
  const sanitized = {} as ListingFilters;
  const droppedKeys: string[] = [];

  for (const [key, value] of Object.entries(filters)) {
    if (SUPPORTED_MARKETPLACE_FILTER_KEYS.has(key as keyof ListingFilters)) {
      (sanitized as Record<string, unknown>)[key] = value;
    } else {
      droppedKeys.push(key);
    }
  }

  if (droppedKeys.length > 0) {
    logger.listings.warn("Dropping unsupported marketplace filter keys", { droppedKeys });
    captureServerEvent("marketplace_filters_sanitized", { droppedKeys });
  }

  return sanitized;
}

export async function getFilteredMarketplaceListings(
  filters: ListingFilters
): Promise<PaginatedListingsResult> {
  return getPublicListings(sanitizeMarketplaceFilters(filters));
}

export async function getMarketplaceListingsByIds(ids: string[]) {
  return getStoredListingsByIds(ids);
}

export async function getMarketplaceListingBySlug(slug: string): Promise<Listing | null> {
  const storedListing = await withNextCache<Listing | null>(
    [`marketplace-listing:${slug}`],
    () => getStoredListingBySlug(slug),
    60
  );

  if (!storedListing || storedListing.status !== "approved") return null;

  const maskedListing = {
    ...storedListing,
    whatsappPhone: maskPhoneNumber(storedListing.whatsappPhone),
  };

  if (!storedListing.expertInspection?.documentPath) return maskedListing;

  const signedUrl = await createExpertDocumentSignedUrl(
    storedListing.expertInspection.documentPath
  );

  return {
    ...maskedListing,
    expertInspection: {
      ...storedListing.expertInspection,
      documentUrl: signedUrl ?? storedListing.expertInspection.documentUrl,
    },
  };
}

export async function getListingById(id: string) {
  return getStoredListingById(id);
}

export async function getMarketplaceSeller(sellerId: string): Promise<Profile | null> {
  return withNextCache(
    [`marketplace-seller:${sellerId}`],
    () => getPublicSellerProfile(sellerId),
    300
  );
}

export async function getPublicMarketplaceListings(
  filters: ListingFilters = { page: 1, limit: 12, sort: "newest" }
) {
  const cacheKey = `public-listings:${JSON.stringify(filters)}`;
  return withNextCache([cacheKey], () => getFilteredMarketplaceListings(filters), 60);
}

export async function getAllKnownListings() {
  const result = await getPublicListings({ limit: 100, page: 1, sort: "newest" });
  return result.listings;
}

export async function getSimilarMarketplaceListings(
  slug: string,
  brand: string,
  city: string
): Promise<Listing[]> {
  return withNextCache(
    [`similar-marketplace-listings:${slug}:${brand}:${city}`],
    async () => {
      // Fetch by brand first; supplement with city listings if not enough results
      const brandResult = await getPublicListings({ brand, limit: 10, page: 1, sort: "newest" });
      const byBrand = brandResult.listings.filter((l) => l.slug !== slug);

      if (byBrand.length >= 3) return byBrand.slice(0, 3);

      const cityResult = await getPublicListings({ city, limit: 10, page: 1, sort: "newest" });
      const brandIds = new Set(byBrand.map((l) => l.id));
      const byCity = cityResult.listings.filter((l) => l.slug !== slug && !brandIds.has(l.id));

      return [...byBrand, ...byCity].slice(0, 3);
    },
    120
  );
}
