import { Listing, ListingCreateInput } from "@/types";

import { createDatabaseListing, updateDatabaseListing } from "../listing-submission-persistence";
import { buildListingRecord } from "../listing-submissions";
import { getExistingListingSlugs } from "../listing-submissions";

/**
 * Logic for handling listing submissions, drafts, and updates.
 * Focused on "write" operations initiated by sellers.
 */

export async function createNewListing(input: ListingCreateInput, sellerId: string) {
  const existingSlugs = await getExistingListingSlugs();
  const listing = buildListingRecord(input, sellerId, existingSlugs, {
    status: "pending_ai_review",
  });
  return createDatabaseListing(listing);
}

export async function saveAsDraft(input: ListingCreateInput, sellerId: string) {
  const existingSlugs = await getExistingListingSlugs();
  const listing = buildListingRecord(input, sellerId, existingSlugs, { status: "draft" });
  return createDatabaseListing(listing);
}

export async function updateExistingListing(listing: Listing) {
  return updateDatabaseListing(listing);
}
