import { CURRENT_YEAR } from "../datetime/date-utils";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://otoburada.com";

export function getAppUrl(): string {
  return APP_URL;
}

export function getAppUrlWithFallback(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://otoburada.com";
}

export function getRequiredAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set");
  }
  return url;
}

export function buildAbsoluteUrl(path: string): string {
  const base = getAppUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export function buildListingsMetadata() {
  return {
    title: "Satılık Arabalar - Türkiye'nin En Büyük Araç İlan Pazarı",
    description:
      "Türkiye'nin en güvenilir satılık araba ilanları. Binlerce satılık araç ilanı, en uygun fiyatlar ve güvenli alışveriş.",
    url: buildAbsoluteUrl("/listings"),
  };
}

export function buildListingDetailMetadata(listing: {
  title: string;
  slug: string;
  price?: number;
}) {
  return {
    title: `${listing.title} - Satılık | OtoBurada`,
    description: `${listing.title} satılık ilanı. ${listing.price ? `${listing.price.toLocaleString("tr-TR")} TL` : ""} Fabrika çıkışı, garantili araç ilanları OtoBurada'da.`,
    url: buildAbsoluteUrl(`/listing/${listing.slug}`),
  };
}

export const FEATURES = {
  chat: true,
  offers: true,
  doping: true,
  favorites: true,
  savedSearches: true,
  priceEstimation: true,
  aiListing: true,
  expertiz: true,
  tickets: true,
  TICKETS: true,
  PWA: true,
} as const;

export interface StructuredDataProps {
  siteName?: string;
  title: string;
  description?: string;
  url?: string;
  image?: string;
  price?: number;
  currency?: string;
}

export function BreadcrumbStructuredData({ items }: { items: { name: string; url: string }[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function ListingStructuredData({ items }: { items: StructuredDataProps[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: item.url || getAppUrl(),
      name: item.title,
      description: item.description,
      image: item.image,
    })),
  };
}

export function ListingDetailStructuredData(props: StructuredDataProps) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: props.title,
    description: props.description,
    image: props.image,
    offers: {
      "@type": "Offer",
      price: props.price,
      priceCurrency: props.currency || "TRY",
      availability: "https://schema.org/InStock",
    },
  };
}

export function OrganizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "OtoBurada",
    url: getAppUrl(),
    logo: `${getAppUrl()}/logo.png`,
    description: "Türkiye'nin en güvenilir satılık araba ilanları platformu",
    sameAs: ["https://www.instagram.com/otoburada/", "https://www.facebook.com/otoburada/"],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+90-850-XXX-XXXX",
      contactType: "customer service",
      availableLanguage: "Turkish",
    },
  };
}

export function WebSiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "OtoBurada",
    url: getAppUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getAppUrl()}/listings?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

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

export const reportReasons = [
  "fake_listing",
  "wrong_info",
  "spam",
  "price_manipulation",
  "invalid_verification",
  "other",
] as const;

export const reportStatuses = ["open", "reviewing", "resolved", "dismissed"] as const;

export const notificationTypes = [
  "favorite",
  "moderation",
  "report",
  "system",
  "question",
] as const;

export const reportReasonLabels = {
  fake_listing: "Sahte ilan",
  wrong_info: "Yanlış bilgi",
  spam: "Spam veya tekrar",
  price_manipulation: "Fiyat manipülasyonu",
  invalid_verification: "Geçersiz kimlik/ilan",
  other: "Diğer",
} as const;

export const reportStatusLabels = {
  open: "Yeni",
  reviewing: "İnceleniyor",
  resolved: "Çözüldü",
  dismissed: "Kapatıldı",
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
  "ban",
  "unban",
  "promote",
  "demote",
  "delete_user",
  "credit_grant",
  "doping_grant",
] as const;

export const moderationActionLabels = {
  approve: "Onay",
  reject: "Red",
  archive: "Arşiv",
  review: "İnceleme",
  resolve: "Çözüm",
  dismiss: "Kapatma",
  edit: "Düzenleme",
  ban: "Yasakla",
  unban: "Yasağı Kaldır",
  promote: "Yetki Yükselt",
  demote: "Yetki Düşür",
  delete_user: "Sil",
  credit_grant: "Kredi Yükle",
  doping_grant: "Doping Ver",
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
export const expertDocumentAcceptedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const expertDocumentMaxSizeInBytes = 10 * 1024 * 1024; // 10MB
export const maximumListingPrice = 100_000_000;
export const maximumDescriptionLength = 5000;
export const maximumNoteLength = 1000;

export const carPartDamageStatuses = [
  "orijinal",
  "boyali",
  "lokal_boyali",
  "degisen",
  "bilinmiyor",
] as const;

export const carPartDamageStatusLabels: Record<(typeof carPartDamageStatuses)[number], string> = {
  orijinal: "Orijinal",
  boyali: "Boyalı",
  lokal_boyali: "Lokal Boyalı",
  degisen: "Değişen",
  bilinmiyor: "Bilinmiyor",
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
  "arka_tampon",
] as const;

export const carPartLabels: Record<(typeof carParts)[number], string> = {
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
  arka_tampon: "Arka Tampon",
};

export const fuelTypeLabels: Record<(typeof fuelTypes)[number], string> = {
  benzin: "Benzin",
  dizel: "Dizel",
  lpg: "LPG",
  hibrit: "Hibrit",
  elektrik: "Elektrik",
};

export const transmissionTypeLabels: Record<(typeof transmissionTypes)[number], string> = {
  manuel: "Manuel",
  otomatik: "Otomatik",
  yari_otomatik: "Yarı Otomatik",
};

export const listingStatusLabels: Record<(typeof listingStatuses)[number], string> = {
  draft: "Taslak",
  pending: "Onay Bekliyor",
  pending_ai_review: "AI İncelemesinde",
  approved: "Yayında",
  rejected: "Reddedildi",
  flagged: "Bayraklandı",
  archived: "Arşivlendi",
};

export const userRoleLabels: Record<(typeof userRoles)[number], string> = {
  user: "Kullanıcı",
  admin: "Yönetici",
};

export const userTypeLabels = {
  individual: "Bireysel",
  professional: "Pro",
  corporate: "Kurumsal Filo",
  staff: "Personel",
} as const;

export { contactFormSchema, type ContactFormValues } from "../validators/feedback";
export { issuesToFieldErrors } from "../validators/helpers";
