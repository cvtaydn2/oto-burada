import {
  getProfileRestrictionState,
  isProfileTrustedForBadges,
} from "@/features/profile/services/profile-restrictions";
import type { Profile } from "@/types";

interface SellerTrustSummary {
  badgeLabel: string | null;
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

  const restrictionState = getProfileRestrictionState(seller);
  if (restrictionState === "banned") return 0;

  let score = 0;

  // 1. Account Age (Base Crust)
  const accountAgeMonths = getAccountAgeMonths(seller.createdAt);
  if (accountAgeMonths >= 24) score += 30;
  else if (accountAgeMonths >= 12) score += 22;
  else if (accountAgeMonths >= 6) score += 14;
  else if (accountAgeMonths >= 1) score += 8;

  // 2. Verification Core Points
  if (seller.verificationStatus === "approved") {
    score += 35;
  } else if (seller.isVerified) {
    score += 20;
  }

  if (seller.emailVerified) {
    score += 10;
  }

  // 3. Trust Decay (Staleness)
  // If last verification review was > 12 months ago, trust decays
  if (seller.verificationReviewedAt) {
    const monthsSinceReview = getAccountAgeMonths(seller.verificationReviewedAt);
    if (monthsSinceReview >= 12) {
      score -= 15; // Penalty for stale verification
    }
  }

  // 4. Risk-Based Suppression (Temporary Restrictions)
  if (restrictionState === "restricted_review") {
    score -= 40; // Severe penalty while under investigation
  }

  return Math.max(0, Math.min(score, 100));
}

export function getSellerTrustSummary(
  seller: Profile | null,
  activeListingCount: number
): SellerTrustSummary {
  if (!seller) {
    return {
      badgeLabel: null,
      score: 0,
      signals: [],
    };
  }

  const signals: string[] = [];

  const restrictionState = getProfileRestrictionState(seller);
  if (restrictionState === "restricted_review") {
    return {
      badgeLabel: null,
      score: 0,
      signals: ["Hesap güvenlik incelemesinde"],
    };
  }

  if (restrictionState === "banned") {
    return {
      badgeLabel: null,
      score: 0,
      signals: ["Hesap kısıtlı"],
    };
  }

  const score = calculateTrustScore(seller);
  const accountAgeMonths = getAccountAgeMonths(seller.createdAt);
  const isTrusted = isProfileTrustedForBadges(seller);

  if (accountAgeMonths >= 12) {
    signals.push(`${Math.floor(accountAgeMonths / 12)}+ yıl hesap geçmişi`);
  } else if (accountAgeMonths >= 1) {
    signals.push(`${accountAgeMonths} ay hesap geçmişi`);
  } else {
    signals.push("Yeni hesap");
  }

  // Deterministic Staleness: If verification is > 24 months old, it's considered expired for labels
  const monthsSinceReview = seller.verificationReviewedAt
    ? getAccountAgeMonths(seller.verificationReviewedAt)
    : 999;
  const isStale = monthsSinceReview >= 24;

  // Only show verification signals if TRUSTED and NOT STALE and ABOVE SAFETY FLOOR (40)
  const showPremiumSignals = isTrusted && !isStale && score >= 40;

  if (showPremiumSignals) {
    if (seller.verificationStatus === "approved") {
      signals.push("İşletme doğrulandı");
    } else if (seller.isVerified) {
      signals.push("Kimlik doğrulandı");
    }

    if (seller.emailVerified) {
      signals.push("E-posta onaylı");
    }
  }

  let badgeLabel: string | null = null;
  // Labels are strictly suppressed for restricted, stale, or low-score accounts
  if (showPremiumSignals) {
    if (seller.verificationStatus === "approved" && score >= 50) {
      badgeLabel = "Doğrulanmış İşletme";
    } else if (seller.isVerified && seller.emailVerified && score >= 35) {
      badgeLabel = "Doğrulanmış Satıcı";
    }
  }

  if (activeListingCount > 0) {
    signals.push(`${activeListingCount} aktif ilan geçmişi`);
  }

  return {
    badgeLabel,
    score,
    signals: signals.slice(0, 4),
  };
}
