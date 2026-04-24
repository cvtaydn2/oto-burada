import { archiveListing } from "@/services/listings/listing-submission-persistence";
import type { Listing } from "@/types";

import { ListingStatusMachine } from "../logic/listing-status-machine";

export interface ArchiveListingResult {
  success: boolean;
  listing?: Listing;
  error?: string;
}

export async function archiveListingUseCase(
  listingId: string,
  sellerId: string,
  currentStatus: Listing["status"]
): Promise<ArchiveListingResult> {
  // 1. Validate Transition
  if (!ListingStatusMachine.canTransition(currentStatus, "archive")) {
    return {
      success: false,
      error: `Cannot archive listing in ${currentStatus} status.`,
    };
  }

  // 2. Perform persistence
  const result = await archiveListing(listingId, sellerId);

  if (result.error) {
    return {
      success: false,
      error:
        result.error === "concurrent_update_detected"
          ? "Listing was modified by another process. Please refresh."
          : "Failed to archive listing.",
    };
  }

  return {
    success: true,
    listing: result.listing,
  };
}
