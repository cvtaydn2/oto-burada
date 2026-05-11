// Marketplace utilities

export function formatListingTitle(make: string, model: string, year?: number): string {
  return `${make} ${model}${year ? ` ${year}` : ""}`.trim();
}

export function getListingStatusColor(status: string): string {
  const colors = {
    active: "text-green-600",
    inactive: "text-gray-500",
    pending: "text-yellow-600",
    rejected: "text-red-600",
  };
  return colors[status as keyof typeof colors] || colors.inactive;
}

export interface DopingDisplayItem {
  id: string;
  name: string;
  type: string;
  label?: string;
  expiresAt?: string;
}

const DOPING_TYPE_TO_SHORT: Record<string, string> = {
  homepage_showcase: "homepage",
  urgent: "urgent",
  top_rank: "top",
  small_photo: "small_photo",
  category_showcase: "category",
  detailed_search_showcase: "detailed_search",
  bold_frame: "bold",
  bump: "bump",
};

const SHORT_TO_DOPING_LABEL: Record<string, string> = {
  homepage: "Öne Çıkan",
  urgent: "Acil",
  top: "Üst Sıra",
  small_photo: "Küçük Fotoğraf",
  category: "Kategori Vitrini",
  detailed_search: "Detaylı Arama",
  bold: "Kalın Yazı",
  bump: "Güncelim",
};

export function getListingDopingDisplayItems(listing: {
  doping?: { type: string; startDate?: string; endDate?: string }[];
}): DopingDisplayItem[] {
  if (!listing.doping || !Array.isArray(listing.doping)) return [];
  return listing.doping.map((d) => {
    const shortType = DOPING_TYPE_TO_SHORT[d.type as string] || d.type || "standard";
    return {
      id: d.type || "unknown",
      name: SHORT_TO_DOPING_LABEL[shortType] || "Doping",
      type: d.type || "standard",
      label: SHORT_TO_DOPING_LABEL[shortType] || "Doping",
      expiresAt: d.endDate,
    };
  });
}

export function getSellerTrustUI(seller: {
  userType?: string;
  rating?: number;
  listingCount?: number;
}) {
  return {
    isPro: seller.userType === "professional",
    rating: seller.rating || 0,
    listingCount: seller.listingCount || 0,
    trustLevel:
      seller.userType === "professional"
        ? "pro"
        : seller.rating && seller.rating > 4.5
          ? "trusted"
          : "standard",
  };
}

export function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createExchangeOffer(params: Record<string, unknown>) {
  return { id: "mock", ...params };
}

export function respondToExchangeOffer(params: Record<string, unknown>) {
  return { success: true, ...params };
}

export function getGalleryBySlug(_slug: string) {
  if (_slug) {
  }
  return null;
}

export function recordGalleryView(_params: unknown) {
  if (_params) {
  }
  return { success: true };
}

export interface ListingPromoBadgeItem {
  id: string;
  label: string;
  type: string;
  expiresAt?: string;
}

export function getListingPromoBadgeItems(listing: {
  doping?: { type: string; startDate?: string; endDate?: string }[];
}): ListingPromoBadgeItem[] {
  if (!listing.doping || !Array.isArray(listing.doping)) return [];
  return listing.doping.map((d) => ({
    id: d.type || "unknown",
    label:
      d.type === "homepage"
        ? "Öne Çıkan"
        : d.type === "urgent"
          ? "Acil"
          : d.type === "top"
            ? "Üst Sıra"
            : "Doping",
    type: d.type || "standard",
    expiresAt: d.endDate,
  }));
}

export function getMemberSinceYear(createdAt: string | null | undefined): number | null {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (isNaN(date.getTime())) return null;
  return date.getFullYear();
}

export function getMembershipYears(createdAt: string | null | undefined): number | null {
  const year = getMemberSinceYear(createdAt);
  if (!year) return null;
  return new Date().getFullYear() - year;
}

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

export function getListingDopingStatusTone(
  expiresAt?: string | null
): "neutral" | "expiring" | "single_use" {
  if (!expiresAt) return "single_use";
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilExpiry < 24) return "expiring";
  return "neutral";
}

export interface ListingBadgeStates {
  isUrgent: boolean;
  isTop: boolean;
  isFeatured: boolean;
  isHighlighted: boolean;
}

const DOPING_TYPE_SHORT_MAP: Record<string, string> = {
  homepage_showcase: "homepage",
  urgent: "urgent",
  top_rank: "top",
  bold_frame: "bold",
};

export function getListingBadgeStates(listing: {
  doping?: { type: string }[];
}): ListingBadgeStates {
  if (!listing.doping?.length)
    return { isUrgent: false, isTop: false, isFeatured: false, isHighlighted: false };
  const types = listing.doping.map((d) => {
    return DOPING_TYPE_SHORT_MAP[d.type as string] || d.type;
  });
  return {
    isUrgent: types.includes("urgent"),
    isTop: types.includes("top"),
    isFeatured: types.includes("homepage"),
    isHighlighted: types.includes("bold"),
  };
}

export function getListingCoverImage(listing: {
  images?: { url: string; isCover: boolean }[];
}): string | null {
  const cover = listing.images?.find((img) => img.isCover);
  return cover?.url || listing.images?.[0]?.url || null;
}
