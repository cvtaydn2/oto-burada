import type { Profile } from "@/types";

interface SellerTrustSummary {
  badgeLabel: string | null;
  score: number;
  signals: string[];
}

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

export function getSellerTrustSummary(
  seller: Profile | null,
  activeListingCount: number,
): SellerTrustSummary {
  if (!seller) {
    return {
      badgeLabel: null,
      score: 0,
      signals: [],
    };
  }

  const signals: string[] = [];
  let score = 4.5;

  if (seller.fullName.trim().length > 0) {
    signals.push("Profil adı mevcut");
    score += 1.2;
  }

  if (seller.phone.trim().length > 0) {
    signals.push("Telefon bilgisi mevcut");
    score += 1.5;
  }

  if (seller.city.trim().length > 0) {
    signals.push("Şehir bilgisi mevcut");
    score += 0.8;
  }

  if (activeListingCount > 0) {
    signals.push(`${activeListingCount} aktif ilan`);
    score += Math.min(activeListingCount, 3) * 0.6;
  }

  const membershipStart = new Date(seller.createdAt);
  if (!Number.isNaN(membershipStart.getTime())) {
    const yearsAsMember = Math.max(
      0,
      new Date().getFullYear() - membershipStart.getFullYear(),
    );
    signals.push(`${membershipStart.getFullYear()} den beri uye`);
    score += Math.min(yearsAsMember, 4) * 0.35;
  }

  return {
    badgeLabel: seller.phone.trim().length > 0 ? "Profil bilgileri mevcut" : null,
    score: roundToSingleDecimal(Math.min(score, 9.9)),
    signals: signals.slice(0, 4),
  };
}
