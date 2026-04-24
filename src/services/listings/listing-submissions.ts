import { cookies } from "next/headers";

// Feature Modules
import { createListingEntity } from "@/domain/logic/listing-factory";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { listingSchema } from "@/lib/validators";
import type { Listing, ListingCreateInput } from "@/types";

import { listingSubmissionsCookieName } from "./constants";
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
export { getDatabaseListings, getFilteredDatabaseListings };
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

  // 1. Storage Cleanup (Side effect before deletion)
  if (listing.images.length > 0) {
    const storagePaths = (listing.images as import("@/types").ListingImage[])
      .map((img) => img.storagePath)
      .filter((path) => path.length > 0);

    if (storagePaths.length > 0) {
      const bucketName = process.env.SUPABASE_STORAGE_BUCKET_LISTINGS ?? "listing-images";
      const { queueFileCleanup } = await import("@/lib/storage/registry");
      await queueFileCleanup(bucketName, storagePaths);
    }
  }

  // 2. Perform Atomic Deletion via persistence layer
  const result = await deleteListing(listingId, listing.version ?? 0);

  if (result.error === "concurrent_update_detected") {
    return { error: "CONFLICT" as const };
  }

  if (!result.success) {
    return null;
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

export async function getLegacyStoredListings() {
  const cookieStore = await cookies();
  return parseStoredListings(cookieStore.get(listingSubmissionsCookieName)?.value).sort(
    (left: Listing, right: Listing) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)
  );
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
  const cookieListings = await getLegacyStoredListings();
  return (
    cookieListings.find(
      (l) =>
        l.id === listingId &&
        l.sellerId === sellerId &&
        (l.status === "draft" || l.status === "pending")
    ) ?? null
  );
}

export async function getStoredUserListings(
  sellerId: string,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedListingsResult> {
  const admin = createSupabaseAdminClient();

  const dataQuery = buildListingBaseQuery(admin, listingSelect, {
    sellerId,
    filters: { page, limit },
  });

  const countQuery = buildListingBaseQuery(admin, "id", {
    sellerId,
    countOnly: true,
  });

  const [dataResult, countResult] = await Promise.all([dataQuery, countQuery]);

  if (dataResult.error) {
    return { listings: [], total: 0, page, limit, hasMore: false };
  }

  const listings = (dataResult.data ?? []).map(mapListingRow);
  const total = countResult.count ?? 0;
  const hasMore = page * limit < total;

  return {
    listings,
    total,
    page,
    limit,
    hasMore,
  };
}

export async function getExistingListingSlugs(): Promise<{ id: string; slug: string }[]> {
  if (!hasSupabaseAdminEnv()) return [];
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("listings").select("id, slug").neq("status", "archived");
  return (data ?? []) as { id: string; slug: string }[];
}

export async function getStoredListingBySlug(slug: string) {
  const databaseListings = await getDatabaseListings({ slug });
  return databaseListings?.[0] ?? null;
}

export async function checkListingExistsById(listingId: string) {
  const databaseListings = await getDatabaseListings({ ids: [listingId] });
  return databaseListings && databaseListings.length > 0;
}

export async function getStoredListingById(listingId: string) {
  const databaseListings = await getDatabaseListings({ ids: [listingId] });
  return databaseListings?.[0] ?? null;
}

export async function getStoredListingsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const databaseListings = await getDatabaseListings({ ids });
  return databaseListings ?? [];
}

/** @deprecated LEGACY ONLY: Used by migration scripts. */
export async function getLegacyStoredUserListings(sellerId: string) {
  return (await getLegacyStoredListings()).filter((listing) => listing.sellerId === sellerId);
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
