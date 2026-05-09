import { listingSchema } from "@/lib";
import type { Listing } from "@/types";

export type ListingModerationDecision = "approve" | "reject";

export interface ModerateListingInput {
  action: ListingModerationDecision;
  adminUserId: string;
  listingId: string;
  note?: string | null;
}

export type AtomicModerateListingResult = {
  success: boolean;
};

export interface ModerateListingsInput {
  action: ListingModerationDecision;
  adminUserId: string;
  listingIds: string[];
  note?: string | null;
}

/**
 * Build default fallback moderation note based on action.
 */
export function buildDefaultModerationNote(listing: Listing, action: ListingModerationDecision) {
  return action === "approve"
    ? `${listing.title} ilanı onaylandı.`
    : `${listing.title} ilanı reddedildi.`;
}

/**
 * Applies visual mutation transformations to local listing data.
 */
export function moderateStoredListing(
  existingListing: Listing,
  status: Extract<Listing["status"], "approved" | "rejected">
) {
  return listingSchema.parse({
    ...existingListing,
    status,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Evaluates array to find first matching pending listing.
 */
export function getModeratableListingById(listings: Listing[], listingId: string) {
  return listings.find((listing) => listing.id === listingId && listing.status === "pending");
}
