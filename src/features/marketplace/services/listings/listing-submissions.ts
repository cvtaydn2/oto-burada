// Feature Modules
export { buildListingSlug } from "./listing-submission-helpers";
export { calculateFraudScore } from "./listing-submission-moderation";

// Commands
export * from "./commands/archive-listing";
export * from "./commands/create-listing";
export * from "./commands/delete-listing";
export * from "./commands/update-listing";

// Queries
export {
  getFilteredMarketplaceListings,
  getListingById,
  getMarketplaceListingBySlug,
  getMarketplaceListingsByIds,
  getPublicMarketplaceListings,
  getRecentMarketplaceListings,
  getSimilarMarketplaceListings,
} from "./marketplace-listings";
export * from "./queries/get-listings";

// Mappers & Types
export * from "./listing-submission-query";
export * from "./mappers/listing-row.mapper";

import { listingSchema } from "@/features/shared/lib";
import { createSupabaseAdminClient } from "@/features/shared/lib/admin";
import { hasSupabaseAdminEnv } from "@/features/shared/lib/env";
import type { Listing } from "@/types";

import { createDatabaseListing } from "./commands/create-listing";
import { updateDatabaseListing } from "./commands/update-listing";
import { getStoredListingById } from "./queries/get-listings";

/**
 * Checks if a slug already exists in the database.
 * PERFORMANCE: Uses exact head-only select to minimize data transfer.
 *
 * ── BUG FIX: Issue BUG-11 - Race Condition Documentation ─────────────
 * WARNING: This function has a race condition between check and INSERT.
 * Two concurrent requests can both see the slug as available and attempt to insert.
 *
 * SOLUTION: Database has unique constraint on slug. Handle unique_violation error
 * in createDatabaseListing and retry with a new slug suffix.
 *
 * This check is kept for optimization (avoid unnecessary INSERT attempts) but
 * should not be relied upon for correctness.
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

export async function findEditableListingById(listingId: string, sellerId: string) {
  const { getDatabaseListings } = await import("./listing-submission-query");
  const dbListings = await getDatabaseListings({
    listingId,
    sellerId,
    statuses: ["draft", "pending", "approved", "rejected"],
  });
  if (dbListings?.length) return dbListings[0];
  return null;
}

export async function checkListingExistsById(
  listingId: string,
  options?: { includeBanned?: boolean }
) {
  const listing = await getStoredListingById(listingId, options);
  return !!listing;
}

export async function upsertDatabaseListingRecord(listing: Listing) {
  if (!hasSupabaseAdminEnv()) return null;
  const updatedListing = await updateDatabaseListing(listing);
  if (updatedListing.listing) return updatedListing.listing;

  const created = await createDatabaseListing(listing);
  return created.listing ?? null;
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

// Persistence proxies (backward compatibility)
export {
  mapListingImagesToDatabaseRows,
  mapListingToDatabaseRow,
} from "./listing-submission-persistence";
