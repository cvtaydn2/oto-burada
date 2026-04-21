import { CURRENT_YEAR } from "../utils/date-utils";

export const userRoles = ["user", "admin"] as const;

export const listingStatuses = [
  "draft",
  "pending",
  "pending_ai_review",
  "approved",
  "rejected",
  "flagged",
  "archived",
] as const;

export const fuelTypes = ["benzin", "dizel", "lpg", "hibrit", "elektrik"] as const;

export const transmissionTypes = ["manuel", "otomatik", "yari_otomatik"] as const;

export const reportReasons = ["fake_listing", "wrong_info", "spam", "price_manipulation", "invalid_verification", "other"] as const;

export const reportStatuses = ["open", "reviewing", "resolved", "dismissed"] as const;

export const notificationTypes = ["favorite", "moderation", "report", "system"] as const;

export const reportReasonLabels = {
  fake_listing: "Sahte ilan",
  wrong_info: "Yanlis bilgi",
  spam: "Spam veya tekrar",
  price_manipulation: "Fiyat manipülasyonu",
  invalid_verification: "Geçersiz kimlik/ilan",
  other: "Diger",
} as const;

export const reportStatusLabels = {
  open: "Yeni",
  reviewing: "Inceleniyor",
  resolved: "Cozuldu",
  dismissed: "Kapatildi",
} as const;

export const moderationTargetTypes = ["listing", "report", "user"] as const;

export const moderationActions = [
  "approve",
  "reject",
  "archive",
  "review",
  "resolve",
  "dismiss",
  "edit",
] as const;

export const moderationActionLabels = {
  approve: "Onay",
  reject: "Red",
  archive: "Arsiv",
  review: "Inceleme",
  resolve: "Cozum",
  dismiss: "Kapatma",
  edit: "Düzenleme",
} as const;

export const listingSortOptions = [
  "newest",
  "price_asc",
  "price_desc",
  "mileage_asc",
  "mileage_desc",
  "year_desc",
  "year_asc",
  "oldest",
] as const;

export const expertInspectionGrades = ["a", "b", "c", "d", "e"] as const;

export const expertInspectionStatuses = ["var", "yok", "bilinmiyor"] as const;

export const minimumListingImages = 3;
export const minimumCarYear = 1950;
export const maximumCarYear = CURRENT_YEAR + 1;
export const maximumMileage = 1_000_000;
export const listingImageAcceptedMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export const listingImageMaxSizeInBytes = 5 * 1024 * 1024;
export const expertDocumentAcceptedMimeTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;
export const expertDocumentMaxSizeInBytes = 10 * 1024 * 1024; // 10MB
export const maximumListingPrice = 100_000_000;
export const maximumDescriptionLength = 5000;
export const maximumNoteLength = 1000;

export const carPartDamageStatuses = [
  "orjinal",
  "boyali",
  "lokal_boyali",
  "degisen",
  "bilinmiyor"
] as const;

export const carPartDamageStatusLabels: Record<typeof carPartDamageStatuses[number], string> = {
  orjinal: "Orijinal",
  boyali: "Boyalı",
  lokal_boyali: "Lokal Boyalı",
  degisen: "Değişen",
  bilinmiyor: "Bilinmiyor"
};

export const carParts = [
  "kaput",
  "tavan",
  "bagaj",
  "sol_on_camurluk",
  "sol_on_kapi",
  "sol_arka_kapi",
  "sol_arka_camurluk",
  "sag_on_camurluk",
  "sag_on_kapi",
  "sag_arka_kapi",
  "sag_arka_camurluk",
  "on_tampon",
  "arka_tampon"
] as const;

export const carPartLabels: Record<typeof carParts[number], string> = {
  kaput: "Kaput",
  tavan: "Tavan",
  bagaj: "Bagaj",
  sol_on_camurluk: "Sol Ön Çamurluk",
  sol_on_kapi: "Sol Ön Kapı",
  sol_arka_kapi: "Sol Arka Kapı",
  sol_arka_camurluk: "Sol Arka Çamurluk",
  sag_on_camurluk: "Sağ Ön Çamurluk",
  sag_on_kapi: "Sağ Ön Kapı",
  sag_arka_kapi: "Sağ Arka Kapı",
  sag_arka_camurluk: "Sağ Arka Çamurluk",
  on_tampon: "Ön Tampon",
  arka_tampon: "Arka Tampon"
};

export const fuelTypeLabels: Record<typeof fuelTypes[number], string> = {
  benzin: "Benzin",
  dizel: "Dizel",
  lpg: "LPG",
  hibrit: "Hibrit",
  elektrik: "Elektrik"
};

export const transmissionTypeLabels: Record<typeof transmissionTypes[number], string> = {
  manuel: "Manuel",
  otomatik: "Otomatik",
  yari_otomatik: "Yarı Otomatik"
};

export const listingStatusLabels: Record<typeof listingStatuses[number], string> = {
  draft: "Taslak",
  pending: "Onay Bekliyor",
  pending_ai_review: "AI İncelemesinde",
  approved: "Yayında",
  rejected: "Reddedildi",
  flagged: "Bayraklandı",
  archived: "Arşivlendi"
};

export const userRoleLabels: Record<typeof userRoles[number], string> = {
  user: "Kullanıcı",
  admin: "Yönetici"
};

export const userTypeLabels = {
  individual: "Bireysel",
  professional: "Kurumsal",
  staff: "Personel"
} as const;
