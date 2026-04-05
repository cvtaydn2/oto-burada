export const userRoles = ["user", "admin"] as const;

export const listingStatuses = [
  "draft",
  "pending",
  "approved",
  "rejected",
  "archived",
] as const;

export const fuelTypes = ["benzin", "dizel", "lpg", "hibrit", "elektrik"] as const;

export const transmissionTypes = ["manuel", "otomatik", "yari_otomatik"] as const;

export const reportReasons = ["fake_listing", "wrong_info", "spam", "other"] as const;

export const reportStatuses = ["open", "reviewing", "resolved", "dismissed"] as const;

export const moderationTargetTypes = ["listing", "report"] as const;

export const moderationActions = [
  "approve_listing",
  "reject_listing",
  "archive_listing",
  "review_report",
  "resolve_report",
  "dismiss_report",
] as const;

export const listingSortOptions = [
  "newest",
  "price_asc",
  "price_desc",
  "mileage_asc",
  "year_desc",
] as const;

export const minimumListingImages = 3;
export const minimumCarYear = 1950;
export const maximumCarYear = new Date().getFullYear() + 1;
export const maximumMileage = 1_000_000;
