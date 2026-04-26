// Feature Modules
import { createListingEntity } from "@/domain/logic/listing-factory";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { listingSchema } from "@/lib/validators";
import type { Listing, ListingCreateInput } from "@/types";

import { buildListingSlug } from "./listing-submission-helpers";
import { calculateFraudScore } from "./listing-submission-moderation";

export { buildListingSlug, calculateFraudScore };
import {
  archiveListing,
  createDatabaseListing,
  deleteListing,
  mapListingImagesToDatabaseRows,
  mapListingToDatabaseRow,
  updateDatabaseListing,
} from "./listing-submission-persistence";
import {
  buildListingBaseQuery,
  getDatabaseListings,
  getFilteredDatabaseListings,
  getSimilarDatabaseListings,
  listingSelect,
  PaginatedListingsResult,
} from "./listing-submission-query";
import { ListingImageRow, ListingRow, mapListingRow } from "./listing-submission-types";

// Re-export types for backward compatibility
export type { ListingImageRow, ListingRow };

/** Orchestrates the creation of a listing record with all computed fields (slug, fraud score). */
export function buildListingRecord(
  input: ListingCreateInput,
  sellerId: string,
  existingListings: { id: string; slug: string }[],
  options?: {
    existingListing?: Listing;
    id?: string;
    status?: Listing["status"];
  }
) {
  return createListingEntity(input, sellerId, existingListings, options);
}

// Proxy exports for query logic
export { getDatabaseListings, getFilteredDatabaseListings, getSimilarDatabaseListings };
export type { PaginatedListingsResult };

export async function archiveDatabaseListing(listingId: string, sellerId: string) {
  const result = await archiveListing(listingId, sellerId);

  if (result.error) {
    if (result.error === "concurrent_update_detected") {
      return { error: "CONFLICT" as const };
    }
    return null;
  }

  // Map back to Listing entity (using the query layer to ensure full consistency)
  const [listing] = (await getDatabaseListings({ listingId })) ?? [];
  return { data: listing ?? null };
}

export async function deleteDatabaseListing(listingId: string, sellerId: string) {
  // Fetch the listing to verify ownership, status, and VERSION
  const listing = (await getDatabaseListings({ listingId, sellerId }))?.[0];

  if (!listing) return null;
  if (listing.status !== "archived") return null;

  // 1. Perform Atomic Deletion FIRST — storage cleanup only if this succeeds
  const result = await deleteListing(listingId, listing.version ?? 0);

  if (result.error === "concurrent_update_detected") {
    return { error: "CONFLICT" as const };
  }

  if (!result.success) {
    return null;
  }

  // 2. Storage Cleanup — fire-and-forget after confirmed DB deletion
  // DB is already consistent; storage orphans are cleaned by a background job if this fails.
  if (listing.images.length > 0) {
    const storagePaths = (listing.images as import("@/types").ListingImage[])
      .map((img) => img.storagePath)
      .filter((path) => path.length > 0);

    if (storagePaths.length > 0) {
      const bucketName = process.env.SUPABASE_STORAGE_BUCKET_LISTINGS ?? "listing-images";
      const { queueFileCleanup } = await import("@/lib/storage/registry");
      // Non-blocking: DB is already consistent, log failure but don't throw
      queueFileCleanup(bucketName, storagePaths).catch((err) => {
        console.error("[deleteDatabaseListing] Storage cleanup failed:", err);
      });
    }
  }

  return { id: listingId, deleted: true };
}

// Cookie & Draft Logic
export function parseStoredListings(rawValue?: string | null) {
  if (!rawValue) return [] satisfies Listing[];
  try {
    const parsed = JSON.parse(rawValue);
    const result = listingSchema.array().safeParse(parsed);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

export function serializeStoredListings(listings: Listing[]) {
  return JSON.stringify(listings);
}

// Orchestration Helpers
export function buildPendingListing(
  input: ListingCreateInput,
  sellerId: string,
  existingListings: { id: string; slug: string }[]
) {
  return buildListingRecord(input, sellerId, existingListings, { status: "pending" });
}

export function buildUpdatedListing(
  input: ListingCreateInput,
  existingListing: Listing,
  existingListings: { id: string; slug: string }[]
) {
  const nextStatus =
    existingListing.status === "draft" || existingListing.status === "pending"
      ? existingListing.status
      : "pending";
  return buildListingRecord(input, existingListing.sellerId, existingListings, {
    existingListing,
    status: nextStatus,
  });
}

export async function findEditableListingById(listingId: string, sellerId: string) {
  const dbListings = await getDatabaseListings({
    listingId,
    sellerId,
    statuses: ["draft", "pending", "approved", "rejected"],
  });
  if (dbListings?.length) return dbListings[0];
  return null;
}

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getStoredUserListings(
  sellerId: string,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedListingsResult> {
  const supabase = await createSupabaseServerClient();

  const { data, count, error } = await buildListingBaseQuery(supabase, listingSelect, {
    sellerId,
    filters: { page, limit },
    withCount: true,
  });

  if (error) {
    return { listings: [], total: 0, page, limit, hasMore: false };
  }

  const listings = (data ?? []).map(mapListingRow);
  const total = count ?? 0;
  const hasMore = page * limit < total;

  return {
    listings,
    total,
    page,
    limit,
    hasMore,
  };
}

/**
 * Checks if a slug already exists in the database.
 * PERFORMANCE: Uses exact head-only select to minimize data transfer.
 */
export async function checkSlugCollision(slug: string): Promise<boolean> {
  if (!hasSupabaseAdminEnv()) return false;
  const admin = createSupabaseAdminClient();
  const { count } = await admin
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("slug", slug)
    .neq("status", "archived")
    .limit(1);

  return (count ?? 0) > 0;
}

export async function getStoredListingBySlug(slug: string, options?: { includeBanned?: boolean }) {
  const databaseListings = await getDatabaseListings({
    slug,
    includeBanned: options?.includeBanned,
  });
  return databaseListings?.[0] ?? null;
}

export async function checkListingExistsById(
  listingId: string,
  options?: { includeBanned?: boolean }
) {
  const databaseListings = await getDatabaseListings({
    ids: [listingId],
    includeBanned: options?.includeBanned,
  });
  return databaseListings && databaseListings.length > 0;
}

export async function getStoredListingById(
  listingId: string,
  options?: { includeBanned?: boolean }
) {
  const databaseListings = await getDatabaseListings({
    ids: [listingId],
    includeBanned: options?.includeBanned,
  });
  return databaseListings?.[0] ?? null;
}

export async function getStoredListingsByIds(ids: string[], options?: { includeBanned?: boolean }) {
  if (ids.length === 0) return [];
  const databaseListings = await getDatabaseListings({
    ids,
    includeBanned: options?.includeBanned,
  });
  return databaseListings ?? [];
}

export async function upsertDatabaseListingRecord(listing: Listing) {
  if (!hasSupabaseAdminEnv()) return null;
  const updatedListing = await updateDatabaseListing(listing);
  if (updatedListing.listing) return updatedListing.listing; // Corrected to return listing directly for compatibility

  const created = await createDatabaseListing(listing);
  return created.listing ?? null;
}

// Export persistence functions for direct use if needed
export {
  archiveListing,
  createDatabaseListing,
  deleteListing,
  mapListingImagesToDatabaseRows,
  mapListingToDatabaseRow,
  updateDatabaseListing,
};
