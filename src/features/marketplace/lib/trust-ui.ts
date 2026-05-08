// Trust UI utilities - expanded with amber and rose for additional tones
import type { Profile } from "@/types";

interface SellerTrustData {
  userType?: string;
  rating?: number;
  listingCount?: number;
  createdAt?: string;
  isBanned?: boolean;
}

export const trustBadgeColors = {
  verified: "text-green-600 bg-green-50 border-green-200",
  trusted: "text-blue-600 bg-blue-50 border-blue-200",
  warning: "text-yellow-600 bg-yellow-50 border-yellow-200",
  amber: "text-amber-600 bg-amber-50 border-amber-200",
  rose: "text-rose-600 bg-rose-50 border-rose-200",
} as const;

export function getTrustBadgeVariant(status: string) {
  return trustBadgeColors[status as keyof typeof trustBadgeColors] || trustBadgeColors.warning;
}

export type TrustTone = "verified" | "trusted" | "warning" | "amber" | "rose";

export function getTrustStyles(tone: TrustTone) {
  return trustBadgeColors[tone] || trustBadgeColors.warning;
}

export function getTrustToneClass(tone: TrustTone | string) {
  const t = tone as TrustTone;
  return trustBadgeColors[t] || trustBadgeColors.warning;
}

export function getTrustDotColor(tone: TrustTone | string) {
  const colors: Record<TrustTone, string> = {
    verified: "bg-green-500",
    trusted: "bg-blue-500",
    warning: "bg-yellow-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };
  const t = tone as TrustTone;
  return colors[t] || colors.warning;
}

export function getTrustIconBg(tone: TrustTone) {
  const colors = {
    verified: "bg-green-100",
    trusted: "bg-blue-100",
    warning: "bg-yellow-100",
  };
  return colors[tone] || colors.warning;
}

export function getSellerTrustUI(seller: SellerTrustData | Partial<Profile> | null | undefined) {
  const sellerData = seller as SellerTrustData | null;
  const isPro = sellerData?.userType === "professional";
  const trustLevel = isPro
    ? "pro"
    : sellerData?.rating && sellerData.rating > 4.5
      ? "trusted"
      : "standard";

  const styles = {
    verified: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
    trusted: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
    warning: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
    rose: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700" },
  };

  const labels = {
    pro: "PROFESYONEL",
    trusted: "GÜVENİLİR",
    standard: "BİREYSEL",
  };

  const tone: TrustTone = isPro ? "verified" : trustLevel === "trusted" ? "trusted" : "warning";

  const colorMap: Record<TrustTone, string> = {
    verified: "emerald",
    trusted: "blue",
    warning: "amber",
    amber: "amber",
    rose: "rose",
  };

  const displayTrustLevel = isPro ? "verified" : trustLevel === "trusted" ? "trusted" : "warning";

  return {
    isPro,
    rating: sellerData?.rating || 0,
    listingCount: sellerData?.listingCount || 0,
    trustLevel,
    styles: styles[tone],
    label: labels[trustLevel as keyof typeof labels] || labels.standard,
    subMessage: sellerData?.isBanned ? "Bu satıcı askıya alınmıştır" : undefined,
    isContactable: !sellerData?.isBanned,
    tone: displayTrustLevel as TrustTone,
    color: colorMap[tone],
    isApproved: isPro,
    restrictionState: sellerData?.isBanned ? "banned" : "active",
    isPremiumVisible: isPro,
    isTrusted: sellerData?.rating ? sellerData.rating > 4.5 : false,
    isProfessional: isPro,
  };
}

export function isBanned(seller: { isBanned?: boolean }) {
  return seller.isBanned === true;
}
