import { publishListing } from "@/features/marketplace/services/listing-submission-persistence";
import type { Listing } from "@/types";

import { ListingStatusMachine } from "../logic/listing-status-machine";

export interface PublishListingResult {
  success: boolean;
  listing?: Listing;
  error?: string;
}

export async function publishListingUseCase(
  listingId: string,
  sellerId: string,
  currentStatus: Listing["status"]
): Promise<PublishListingResult> {
  // 1. Validate Transition
  if (!ListingStatusMachine.canTransition(currentStatus, "publish")) {
    return {
      success: false,
      error: `Cannot publish listing in ${currentStatus} status.`,
    };
  }

  // 2. Perform persistence
  const result = await publishListing(listingId, sellerId);

  if (result.error) {
    return {
      success: false,
      error:
        result.error === "concurrent_update_detected"
          ? "Listing was modified by another process. Please refresh."
          : "Failed to publish listing.",
    };
  }

  return {
    success: true,
    listing: result.listing,
  };
}
