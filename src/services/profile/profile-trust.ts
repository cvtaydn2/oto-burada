import type { Profile } from "@/types";

interface SellerTrustSummary {
  badgeLabel: string;
  score: number;
  signals: string[];
}

function getAccountAgeMonths(createdAt?: string | null) {
  if (!createdAt) return 0;
  const createdTime = Date.parse(createdAt);
  if (Number.isNaN(createdTime)) return 0;
  const ageMs = Date.now() - createdTime;
  return Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30)));
}

export function calculateTrustScore(seller: Partial<Profile> | null): number {
  if (!seller) return 0;
  
  let score = 0;

  const accountAgeMonths = getAccountAgeMonths(seller.createdAt);

  if (accountAgeMonths >= 24) score += 30;
  else if (accountAgeMonths >= 12) score += 22;
  else if (accountAgeMonths >= 6) score += 14;
  else if (accountAgeMonths >= 1) score += 8;

  if (seller.verifiedBusiness) {
    score += 35;
  } else if (seller.isVerified) {
    score += 20;
  }

  if (seller.emailVerified) {
    score += 10;
  }

  return Math.min(score, 100);
}

export function getSellerTrustSummary(
  seller: Profile | null,
  activeListingCount: number,
): SellerTrustSummary {
  if (!seller) {
    return {
      badgeLabel: "Yeni Satıcı",
      score: 0,
      signals: [],
    };
  }

  const signals: string[] = [];

  const score = calculateTrustScore(seller);
  const accountAgeMonths = getAccountAgeMonths(seller.createdAt);

  if (accountAgeMonths >= 12) {
    signals.push(`${Math.floor(accountAgeMonths / 12)}+ yıl hesap geçmişi`);
  } else if (accountAgeMonths >= 1) {
    signals.push(`${accountAgeMonths} ay hesap geçmişi`);
  } else {
    signals.push("Yeni hesap");
  }

  if (seller.verifiedBusiness) {
    signals.push("İşletme doğrulandı");
  } else if (seller.isVerified) {
    signals.push("Kimlik doğrulandı");
  }

  if (seller.emailVerified) {
    signals.push("E-posta onaylı");
  }

  let badgeLabel = "Standart Üye";
  if (score >= 75) badgeLabel = "Güvenilir Satıcı";
  else if (score >= 45) badgeLabel = "Doğrulanan Satıcı";
  else if (score >= 20) badgeLabel = "İncelenebilir Satıcı";

  if (activeListingCount > 0) {
    signals.push(`${activeListingCount} aktif ilan geçmişi`);
  }

  return {
    badgeLabel,
    score, // Score artık 0-100 arasında
    signals: signals.slice(0, 4),
  };
}
