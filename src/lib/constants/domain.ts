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

export const notificationTypes = ["favorite", "moderation", "report", "system"] as const;

export const reportReasonLabels = {
  fake_listing: "Sahte ilan",
  wrong_info: "Yanlis bilgi",
  spam: "Spam veya tekrar",
  other: "Diger",
} as const;

export const reportStatusLabels = {
  open: "Yeni",
  reviewing: "Inceleniyor",
  resolved: "Cozuldu",
  dismissed: "Kapatildi",
} as const;

export const moderationTargetTypes = ["listing", "report"] as const;

export const moderationActions = [
  "approve",
  "reject",
  "archive",
  "review",
  "resolve",
  "dismiss",
] as const;

export const moderationActionLabels = {
  approve: "Onay",
  reject: "Red",
  archive: "Arsiv",
  review: "Inceleme",
  resolve: "Cozum",
  dismiss: "Kapatma",
} as const;

export const listingSortOptions = [
  "newest",
  "price_asc",
  "price_desc",
  "mileage_asc",
  "year_desc",
] as const;

export const expertInspectionGrades = ["a", "b", "c", "d", "e"] as const;

export const expertInspectionStatuses = ["var", "yok", "bilinmiyor"] as const;

export const minimumListingImages = 3;
export const minimumCarYear = 1950;
export const maximumCarYear = new Date().getFullYear() + 1;
export const maximumMileage = 1_000_000;
export const listingImageAcceptedMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export const listingImageMaxSizeInBytes = 5 * 1024 * 1024;
export const maximumListingPrice = 100_000_000;
export const maximumDescriptionLength = 5000;
export const maximumNoteLength = 1000;
