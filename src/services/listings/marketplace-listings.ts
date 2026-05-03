import { withNextCache } from "@/lib/caching/cache";
import { logger } from "@/lib/logging/logger";
import { captureServerEvent } from "@/lib/monitoring/telemetry-server";
import { createSupabasePublicServerClient } from "@/lib/supabase/public-server";
import { getListingBySlug, getPublicListings } from "@/services/listings/catalog";
import {
  getSimilarDatabaseListings,
  marketplaceListingSelect,
  type PaginatedListingsResult,
} from "@/services/listings/listing-submission-query";
import { type ListingRow, mapListingRow } from "@/services/listings/mappers/listing-row.mapper";
import { getPublicSellerProfile } from "@/services/profile/profile-records";
import type { Listing, ListingFilters, Profile } from "@/types";

import {
  getStoredListingById,
  getStoredListingBySlug,
  getStoredListingsByIds,
} from "./listing-submissions";

export { getStoredListingById, getStoredListingBySlug, getStoredListingsByIds };

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
  "featured",
  "galleryPriority",
]);

function sanitizeMarketplaceFilters(filters: ListingFilters): {
  sanitized: ListingFilters;
  droppedKeys: string[];
} {
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

  return { sanitized, droppedKeys };
}

export async function getFilteredMarketplaceListings(
  filters: ListingFilters
): Promise<PaginatedListingsResult> {
  const { sanitized, droppedKeys } = sanitizeMarketplaceFilters(filters);
  const result = await getPublicListings(sanitized);

  if (droppedKeys.length > 0) {
    return {
      ...result,
      metadata: {
        ...result.metadata,
        droppedFilters: droppedKeys,
        warning: "Bazı filtreler desteklenmiyor ve uygulanmadı.",
      },
    };
  }

  return result;
}

export async function getMarketplaceListingsByIds(ids: string[]): Promise<Listing[]> {
  if (ids.length === 0) return [];

  const publicClient = createSupabasePublicServerClient();

  const { data, error } = await publicClient
    .from("listings")
    .select(marketplaceListingSelect)
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
    .select(marketplaceListingSelect)
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

export async function getPublicMarketplaceListings(
  filters: ListingFilters = { page: 1, limit: 12, sort: "newest" }
) {
  const keyParts = [
    "public-listings",
    `p:${filters.page ?? 1}`,
    `l:${filters.limit ?? 12}`,
    `s:${filters.sort ?? "newest"}`,
    `b:${filters.brand ?? "all"}`,
    `m:${filters.model ?? "all"}`,
    `c:${filters.city ?? "all"}`,
    `q:${filters.query ?? ""}`,
    `f:${filters.fuelType ?? ""}`,
    `t:${filters.transmission ?? ""}`,
    `minP:${filters.minPrice ?? ""}`,
    `maxP:${filters.maxPrice ?? ""}`,
    `minY:${filters.minYear ?? ""}`,
    `maxY:${filters.maxYear ?? ""}`,
  ];

  return withNextCache(keyParts, () => getFilteredMarketplaceListings(filters), 60);
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
