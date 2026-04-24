/**
 * Listing-specific utility functions.
 *
 * Covers: formatting, label lookups, badge state derivation, phone masking,
 * and WhatsApp link generation.
 */
import {
  fuelTypeLabels,
  listingStatusLabels,
  transmissionTypeLabels,
} from "@/lib/constants/domain";
import { formatNumber, formatPrice } from "@/lib/utils";
import type { Listing, Profile } from "@/types";

// Re-export formatPrice so existing imports from listing-utils still work
export { formatPrice };

// ─── Formatting ──────────────────────────────────────────────────────────────

/**
 * Formats a mileage value as a Turkish-locale string with "km" suffix.
 * e.g. 125000 → "125.000 km"
 */
export function formatListingMileage(mileage: number): string {
  return `${formatNumber(mileage)} km`;
}

export function getListingStatusLabel(status: Listing["status"]): string {
  return listingStatusLabels[status] ?? status;
}

export function getFuelTypeLabel(fuelType: string): string {
  return fuelTypeLabels[fuelType as keyof typeof fuelTypeLabels] ?? fuelType;
}

export function getTransmissionLabel(transmission: string): string {
  return (
    transmissionTypeLabels[transmission as keyof typeof transmissionTypeLabels] ?? transmission
  );
}

export function getSellerTypeLabel(userType: Profile["userType"]): string {
  switch (userType) {
    case "professional":
      return "Kurumsal Galeri";
    case "individual":
    default:
      return "Bireysel Satıcı";
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function calculateDiscountedPrice(price: number, discountPercent: number): number {
  return Math.round(price * (1 - discountPercent / 100));
}

export function generateListingId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

// ─── Date & Age ──────────────────────────────────────────────────────────────

export function getMemberSinceYear(createdAt: string | null | undefined): number | null {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return null;
  return d.getFullYear();
}

export function getMembershipYears(memberSince: number | null): number | null {
  if (memberSince === null) return null;
  const years = new Date().getFullYear() - memberSince;
  if (isNaN(years) || years < 0) return null;
  return years;
}

export function getListingAgeDays(updatedAt: string): number {
  const d = new Date(updatedAt);
  if (isNaN(d.getTime())) return 0;
  const diffMs = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function getListingAgeText(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Bilinmiyor";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return "Bugün";
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Dün";
  if (diffDays < 7) return `${diffDays} gün önce`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} ay önce`;
  return `${Math.floor(diffDays / 365)} yıl önce`;
}

// ─── Badge & Display State ────────────────────────────────────────────────────

/**
 * Derives which promotional/trust badges are currently active for a listing.
 * All time comparisons use ISO strings for consistency.
 */
export function getListingBadgeStates(listing: Listing) {
  const now = new Date().toISOString();

  return {
    isFeatured:
      (listing.featured && (!listing.featuredUntil || listing.featuredUntil > now)) ||
      (!!listing.homepageShowcaseUntil && listing.homepageShowcaseUntil > now) ||
      (!!listing.categoryShowcaseUntil && listing.categoryShowcaseUntil > now) ||
      (!!listing.detailedSearchShowcaseUntil && listing.detailedSearchShowcaseUntil > now),
    isUrgent: !!listing.urgentUntil && listing.urgentUntil > now,
    isHighlighted:
      (!!listing.highlightedUntil && listing.highlightedUntil > now) ||
      (!!listing.boldFrameUntil && listing.boldFrameUntil > now),
    isSmallPhoto: !!listing.smallPhotoUntil && listing.smallPhotoUntil > now,
    isTopRanked: !!listing.topRankUntil && listing.topRankUntil > now,
    isAdvantageous: (listing.marketPriceIndex ?? 1) < 0.95,
    hasInspection: !!listing.expertInspection?.hasInspection,
  };
}

/**
 * Returns the cover image for a listing, falling back to the first image.
 */
export function getListingCoverImage(listing: Listing) {
  if (!listing.images || listing.images.length === 0) return null;
  return listing.images.find((img) => img.isCover) ?? listing.images[0];
}

// ─── Contact ─────────────────────────────────────────────────────────────────

export function buildWhatsAppOfferLink(phone: string, title: string, offerPrice?: number): string {
  const phoneDigits = phone.replace(/\D/g, "");
  if (!phoneDigits) return "#";

  const message = offerPrice
    ? `${title} ilanınız için ${formatPrice(offerPrice)} TL teklif vermek istiyorum.`
    : `${title} ilanınız için size özel teklif paylaşmak istiyorum.`;

  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}

// ─── Privacy ─────────────────────────────────────────────────────────────────

/**
 * Masks a phone number for public display (KVKK protection).
 * e.g. +90 555 123 45 67 → "+90 555 *** ** **"
 */
export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "Numara belirtilmedi";
  const str = String(phone);
  const clean = str.replace(/\D/g, "");

  if (clean.length < 5) return "**** ****";

  if (clean.startsWith("90")) {
    return `+90 ${clean.slice(2, 5)} *** ** **`;
  }

  return `${str.slice(0, 4)} *** ** **`;
}
