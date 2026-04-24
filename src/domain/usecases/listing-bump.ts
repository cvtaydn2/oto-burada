import { bumpListing } from "@/services/listings/listing-submission-persistence";
import type { Listing } from "@/types";

export interface BumpListingResult {
  success: boolean;
  listing?: Listing;
  error?: string;
  message?: string;
}

export async function bumpListingUseCase(
  listingId: string,
  sellerId: string,
  listing: { status: Listing["status"]; bumpedAt?: string | null }
): Promise<BumpListingResult> {
  // 1. Validate Status
  if (listing.status !== "approved") {
    return {
      success: false,
      error: "Only approved listings can be bumped.",
    };
  }

  // 2. Validate Cool-down (24 hours)
  if (listing.bumpedAt) {
    const lastBump = new Date(listing.bumpedAt).getTime();
    const hoursSinceLastBump = (Date.now() - lastBump) / (1000 * 60 * 60);
    if (hoursSinceLastBump < 24) {
      const hoursLeft = Math.ceil(24 - hoursSinceLastBump);
      return {
        success: false,
        error: `This listing can be bumped again in ${hoursLeft} hours.`,
      };
    }
  }

  // 3. Perform persistence
  const result = await bumpListing(listingId, sellerId);

  if (result.error) {
    return {
      success: false,
      error: "Failed to bump listing.",
    };
  }

  return {
    success: true,
    listing: result.listing,
    message: "Listing successfully bumped!",
  };
}
