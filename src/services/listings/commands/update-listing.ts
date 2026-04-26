import type { Listing, ListingCreateInput } from "@/types";

import { updateDatabaseListing as saveUpdateToDb } from "../listing-submission-persistence";
import { buildListingRecord } from "./create-listing";

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

export async function updateDatabaseListing(listing: Listing) {
  return saveUpdateToDb(listing);
}
