import type { Listing, Profile } from "@/types";
import { fuelTypeLabels, transmissionTypeLabels, listingStatusLabels } from "@/lib/constants/domain";

export function formatPrice(value: number, currency = "TL"): string {
  return `${new Intl.NumberFormat("tr-TR").format(value)} ${currency}`;
}

export function formatListingPrice(price: number): string {
  return new Intl.NumberFormat("tr-TR").format(price);
}

export function formatListingMileage(mileage: number): string {
  return `${new Intl.NumberFormat("tr-TR").format(mileage)} km`;
}

export function buildWhatsAppOfferLink(
  phone: string,
  title: string,
  offerPrice?: number
): string {
  const phoneDigits = phone.replace(/\D/g, "");
  if (!phoneDigits) return "#";

  const message = offerPrice
    ? `${title} ilanınız için ${formatPrice(offerPrice)} TL teklif vermek istiyorum.`
    : `${title} ilanınız için size özel teklif paylaşmak istiyorum.`;

  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}

export function getListingStatusLabel(status: Listing["status"]): string {
  return listingStatusLabels[status] ?? status;
}

export function getFuelTypeLabel(fuelType: string): string {
  return fuelTypeLabels[fuelType as keyof typeof fuelTypeLabels] ?? fuelType;
}

export function getTransmissionLabel(transmission: string): string {
  return transmissionTypeLabels[transmission as keyof typeof transmissionTypeLabels] ?? transmission;
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

export function getMemberSinceYear(createdAt: string | null | undefined): number | null {
  if (!createdAt) return null;
  return new Date(createdAt).getFullYear();
}

export function getMembershipYears(memberSince: number | null): number | null {
  if (memberSince === null) return null;
  return Math.max(new Date().getFullYear() - memberSince, 0);
}

export function getListingAgeDays(updatedAt: string): number {
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function calculateDiscountedPrice(price: number, discountPercent: number): number {
  return Math.round(price * (1 - discountPercent / 100));
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}

export function getListingAgeText(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Dün";
  if (diffDays < 7) return `${diffDays} gün önce`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} ay önce`;
  return `${Math.floor(diffDays / 365)} yıl önce`;
}

export function generateListingId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

/**
 * Masks a phone number for public display (KVKK protection). 
 * Format mask: +90 555 *** ** **
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