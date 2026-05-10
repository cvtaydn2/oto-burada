import {
  getSimilarDatabaseListings,
  listingCardSelect,
  type PaginatedListingsResult,
} from "@/features/marketplace/services/listing-submission-query";
import {
  type ListingRow,
  mapListingRow,
} from "@/features/marketplace/services/mappers/listing-row.mapper";
import {
  canonicalizeMarketplaceFilters,
  DEFAULT_MARKETPLACE_QUERY,
  type MarketplaceListingsQuery,
  serializeMarketplaceQuery,
} from "@/features/marketplace/services/marketplace-query";
import { getPublicSellerProfile } from "@/features/profile/services/profile-records";
import { withNextCache } from "@/lib/cache";
import { logger } from "@/lib/logger";
import { createSupabasePublicServerClient } from "@/lib/public-server";
import { captureServerEvent } from "@/lib/telemetry-server";
import type { Listing, ListingFilters, Profile } from "@/types";

import { getListingBySlug, getPublicListings } from "./catalog";
import {
  getStoredListingById,
  getStoredListingBySlug,
  getStoredListingsByIds,
} from "./listing-submissions";

export { getStoredListingById, getStoredListingBySlug, getStoredListingsByIds };

const SUPPORTED_RAW_MARKETPLACE_FILTER_KEYS = new Set<keyof ListingFilters>([
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
  "featured",
  "galleryPriority",
  "validationError",
]);

function sanitizeRawMarketplaceFilters(filters: ListingFilters): {
  sanitized: ListingFilters;
  droppedKeys: string[];
} {
  const sanitized = {} as ListingFilters;
  const droppedKeys: string[] = [];

  for (const [key, value] of Object.entries(filters)) {
    if (SUPPORTED_RAW_MARKETPLACE_FILTER_KEYS.has(key as keyof ListingFilters)) {
      if (typeof value === "string") {
        (sanitized as Record<string, unknown>)[key] = value.replace(/<[^>]*>/g, "");
      } else {
        (sanitized as Record<string, unknown>)[key] = value;
      }
    } else {
      droppedKeys.push(key);
    }
  }

  if (droppedKeys.length > 0) {
    logger.listings.warn("Dropping unsupported raw marketplace filter keys", { droppedKeys });
    captureServerEvent("marketplace_filters_sanitized", {
      droppedKeys,
      source: "raw_input",
    });
  }

  return { sanitized, droppedKeys };
}

function buildMarketplaceListingsCacheKey(query: MarketplaceListingsQuery): string[] {
  const serialized = JSON.parse(serializeMarketplaceQuery(query)) as Array<[string, unknown]>;

  return ["public-listings", ...serialized.map(([key, value]) => `${key}:${String(value)}`)];
}

function appendDroppedFilterMetadata(
  result: PaginatedListingsResult,
  droppedKeys: string[]
): PaginatedListingsResult {
  if (droppedKeys.length === 0) return result;

  return {
    ...result,
    metadata: {
      ...result.metadata,
      droppedFilters: droppedKeys,
      warning: "Bazı filtreler desteklenmiyor ve uygulanmadı.",
    },
  };
}

export async function getFilteredMarketplaceListings(
  query: MarketplaceListingsQuery
): Promise<PaginatedListingsResult> {
  // Since actual data implementation expects matching shape of Record type, cast safely
  return getPublicListings(query as unknown as ListingFilters);
}

export async function getPublicMarketplaceListings(
  query: MarketplaceListingsQuery = DEFAULT_MARKETPLACE_QUERY
) {
  return withNextCache(
    buildMarketplaceListingsCacheKey(query),
    () => getFilteredMarketplaceListings(query),
    60
  );
}

export async function getPublicMarketplaceListingsFromRawFilters(rawFilters: ListingFilters) {
  const { sanitized, droppedKeys } = sanitizeRawMarketplaceFilters(rawFilters);
  const query = canonicalizeMarketplaceFilters(sanitized);
  const result = await getPublicMarketplaceListings(query);

  return appendDroppedFilterMetadata(result, droppedKeys);
}

export async function getMarketplaceListingsByIds(ids: string[]): Promise<Listing[]> {
  if (ids.length === 0) return [];

  const publicClient = createSupabasePublicServerClient();

  const { data, error } = await publicClient
    .from("listings")
    .select(listingCardSelect)
    .in("id", ids)
    .eq("status", "approved");

  if (error) {
    logger.db.error("Marketplace listings by IDs retrieval failed", { error, ids });
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  return (data as unknown[]).map((row) => mapListingRow(row as unknown as ListingRow));
}

export async function getMarketplaceListingBySlug(slug: string): Promise<Listing | null> {
  const storedListing = await withNextCache<Listing | null>(
    [`marketplace-listing:${slug}`],
    () => getListingBySlug(slug),
    300
  );

  if (!storedListing || storedListing.status !== "approved") return null;

  if (!storedListing.expertInspection?.documentPath) return storedListing;

  return {
    ...storedListing,
    expertInspection: {
      ...storedListing.expertInspection,
      documentUrl: storedListing.expertInspection.documentUrl || undefined,
    },
  };
}

export async function getListingById(id: string): Promise<Listing | null> {
  const publicClient = createSupabasePublicServerClient();

  const { data, error } = await publicClient
    .from("listings")
    .select(listingCardSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    logger.db.error("Public listing by ID retrieval failed", { error, id });
    return null;
  }

  if (!data) return null;

  if (Array.isArray(data)) {
    return data.length > 0 ? mapListingRow(data[0] as unknown as ListingRow) : null;
  }

  return mapListingRow(data as unknown as ListingRow);
}

export async function getMarketplaceSeller(sellerId: string): Promise<Profile | null> {
  return withNextCache(
    [`marketplace-seller:${sellerId}`],
    () => getPublicSellerProfile(sellerId),
    300
  );
}

export async function getRecentMarketplaceListings(limit = 100) {
  const result = await getPublicListings({ limit, page: 1, sort: "newest" });
  return result.listings;
}

export async function getSimilarMarketplaceListings(
  slug: string,
  brand: string,
  city: string
): Promise<Listing[]> {
  return withNextCache(
    [`similar-marketplace-listings:${slug}:${brand}:${city}`],
    () => getSimilarDatabaseListings({ slug, brand, city, limit: 12 }),
    120
  );
}
