import { type Listing } from "@/types";

export function getListingBadgeStates(listing: Listing) {
  const now = new Date().toISOString();
  
  const isFeatured = listing.featured && (!listing.featuredUntil || listing.featuredUntil > now);
  const isUrgent = !!listing.urgentUntil && listing.urgentUntil > now;
  const isHighlighted = !!listing.highlightedUntil && listing.highlightedUntil > now;
  const isAdvantageous = (listing.marketPriceIndex ?? 1) < 0.95;
  const hasInspection = !!listing.expertInspection?.hasInspection;

  return {
    isFeatured,
    isUrgent,
    isHighlighted,
    isAdvantageous,
    hasInspection,
  };
}

export function getListingCoverImage(listing: Listing) {
  if (!listing.images || listing.images.length === 0) return null;
  return listing.images.find((img) => img.isCover) || listing.images[0];
}
