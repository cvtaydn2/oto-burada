import type { Listing } from "@/types";

export type ListingCardInsightTone = "indigo" | "emerald" | "amber";

export interface ListingCardInsight {
  badgeLabel: string;
  tone: ListingCardInsightTone;
  summary: string;
  highlights: string[];
}

export function getListingCardInsights(listing: Listing): ListingCardInsight {
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - listing.year;
  const budgetFriendly = listing.price <= 1_000_000;
  const lowMileage = listing.mileage <= 80_000;
  const easyDrive = listing.transmission === "otomatik" || listing.transmission === "yari_otomatik";
  const newerModel = vehicleAge <= 4;

  if (budgetFriendly && lowMileage) {
    return {
      badgeLabel: "Akilli Secim",
      tone: "emerald",
      summary: "Fiyat ve kilometre dengesi sayesinde hizli karar listesine girmeye uygun.",
      highlights: ["Butce Dostu", "Dusuk KM", newerModel ? "Guncel Model" : "Temiz Profil"],
    };
  }

  if (easyDrive && newerModel) {
    return {
      badgeLabel: "Kolay Karar",
      tone: "indigo",
      summary: "Yeni model yili ve rahat surus kombinasyonu sehir ici kullanim icin guclu.",
      highlights: ["Otomatik Surus", "Guncel Model", lowMileage ? "Dusuk KM" : "Net Bilgiler"],
    };
  }

  if (listing.featured) {
    return {
      badgeLabel: "One Cikan",
      tone: "amber",
      summary: "Platformda daha gorunur tutulan, hizli karsilastirma icin secilen ilanlardan biri.",
      highlights: ["Vitrin Ilani", easyDrive ? "Kolay Surus" : "Net Ozellikler", newerModel ? "Yeni Nesil" : "Dengeli Paket"],
    };
  }

  return {
    badgeLabel: "Incelenebilir",
    tone: "indigo",
    summary: "Temel alanlari net, kart uzerinden ilk eleme yapmaya uygun bir ilan akisi sunuyor.",
    highlights: [budgetFriendly ? "Butce Dostu" : "Pazar Bandinda", lowMileage ? "Dusuk KM" : "Detay Kontrolu", easyDrive ? "Otomatik Surus" : "Klasik Surus"],
  };
}
