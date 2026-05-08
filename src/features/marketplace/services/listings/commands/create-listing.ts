import { createListingEntity } from "@/domain/logic/listing-factory";
import type { Listing, ListingCreateInput } from "@/types";

import { createDatabaseListing as saveListingToDb } from "../listing-submission-persistence";

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

export function buildPendingListing(
  input: ListingCreateInput,
  sellerId: string,
  existingListings: { id: string; slug: string }[]
) {
  return buildListingRecord(input, sellerId, existingListings, { status: "pending" });
}

export async function createDatabaseListing(listing: Listing) {
  return saveListingToDb(listing);
}
