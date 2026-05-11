import { listingSchema } from "@/lib";
import {
  listingRejectReasonDefaultExplanations,
  listingRejectReasonLabels,
} from "@/lib/constants/domain";
import type { Listing, ListingModerationRejectReason } from "@/types";

export type ListingModerationDecision = "approve" | "reject";

export interface ModerateListingInput {
  action: ListingModerationDecision;
  adminUserId: string;
  listingId: string;
  rejectReason?: ListingModerationRejectReason;
}

export type AtomicModerateListingResult = {
  success: boolean;
};

export interface ModerateListingsInput {
  action: ListingModerationDecision;
  adminUserId: string;
  listingIds: string[];
  rejectReason?: ListingModerationRejectReason;
}

/**
 * Build canonical moderation explanation and audit note payload.
 */
export function buildModerationCopy(
  listing: Listing,
  action: ListingModerationDecision,
  rejectReason?: ListingModerationRejectReason
) {
  if (action === "approve") {
    return {
      explanation: `${listing.title} ilanı onaylandı.`,
      moderatorNote: null,
      reasonCode: null,
      sellerMessage: `Tebrikler! "${listing.title}" ilanınız onaylandı ve yayına alındı.`,
      sellerEmailReason: undefined,
    };
  }

  const reasonCode = rejectReason?.reasonCode;
  const defaultExplanation = reasonCode
    ? listingRejectReasonDefaultExplanations[reasonCode]
    : `${listing.title} ilanı reddedildi.`;
  const moderatorNote = rejectReason?.moderatorNote?.trim() || null;
  const label = reasonCode ? listingRejectReasonLabels[reasonCode] : "Moderasyon gerekçesi";

  return {
    explanation: defaultExplanation,
    moderatorNote,
    reasonCode: reasonCode ?? null,
    sellerMessage: `"${listing.title}" ilanınız "${label}" nedeniyle reddedildi. Düzenleyip yeniden gönderebilirsiniz.`,
    sellerEmailReason: moderatorNote
      ? `${defaultExplanation} Moderatör notu: ${moderatorNote}`
      : defaultExplanation,
  };
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
