import { archiveListing as archiveInDb } from "../listing-submission-persistence";
import { getStoredListingById } from "../queries/get-listings";

export async function archiveDatabaseListing(listingId: string, sellerId: string) {
  const result = await archiveInDb(listingId, sellerId);

  if (result.error) {
    if (result.error === "concurrent_update_detected") {
      return { error: "CONFLICT" as const };
    }
    return null;
  }

  // Map back to Listing entity
  const listing = await getStoredListingById(listingId);
  return { data: listing };
}
