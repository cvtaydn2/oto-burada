/**
 * Trust UI ?" single module for all seller trust rendering logic.
 */
import { getProfileRestrictionState } from "@/features/profile/services/profile-restrictions";
import { trust } from "@/features/shared/lib/ui-strings";
import type { Profile } from "@/types";

export type RestrictionState = "active" | "restricted_review" | "banned";
export type TrustTone = "emerald" | "amber" | "slate" | "blue" | "rose";

export const trustThemes = {
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500",
    notice: "bg-emerald-50 border-emerald-100 text-emerald-900",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-700",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
    notice: "bg-amber-50 border-amber-100 text-amber-900",
  },
  slate: {
    bg: "bg-slate-500/10",
    text: "text-slate-700",
    border: "border-slate-500/20",
    dot: "bg-slate-500",
    notice: "bg-slate-50 border-slate-100 text-slate-900",
  },
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    border: "border-blue-500/20",
    dot: "bg-blue-500",
    notice: "bg-blue-50 border-blue-100 text-blue-900",
  },
  rose: {
    bg: "bg-rose-500/10",
    text: "text-rose-600",
    border: "border-rose-500/20",
    dot: "bg-rose-500",
    notice: "bg-rose-50 border-rose-100 text-rose-900",
  },
} as const;

export function getTrustStyles(tone: TrustTone) {
  return trustThemes[tone];
}

export function isBanned(restrictionState: RestrictionState | undefined): boolean {
  return restrictionState === "banned";
}

export function isRestrictedReview(restrictionState: RestrictionState | undefined): boolean {
  return restrictionState === "restricted_review";
}

export function isActive(restrictionState: RestrictionState | undefined): boolean {
  return restrictionState === "active" || restrictionState === undefined;
}

export function canShowPremium(restrictionState: RestrictionState | undefined): boolean {
  return isActive(restrictionState);
}

export function canContact(restrictionState: RestrictionState | undefined): boolean {
  return isActive(restrictionState);
}

export function getTrustDotColor(tone: TrustTone): string {
  return trustThemes[tone].dot;
}

export function getTrustIconBg(tone: TrustTone): string {
  const iconBgs: Record<TrustTone, string> = {
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-100 text-blue-600",
    rose: "bg-rose-100 text-rose-600",
  };
  return iconBgs[tone];
}

export function getTrustToneClass(
  tone: TrustTone,
  variant: "badge" | "notice" | "text" = "badge"
): string {
  const tones: Record<TrustTone, Record<"badge" | "notice" | "text", string>> = {
    emerald: {
      badge: "bg-emerald-50 text-emerald-600 border-emerald-100",
      notice: "bg-emerald-50 border-emerald-100 text-emerald-900",
      text: "text-emerald-600",
    },
    amber: {
      badge: "bg-amber-50 text-amber-700 border-amber-100",
      notice: "bg-amber-50 border-amber-100 text-amber-900",
      text: "text-amber-700",
    },
    slate: {
      badge: "bg-slate-50 text-slate-600 border-slate-100",
      notice: "bg-slate-50 border-slate-100 text-slate-900",
      text: "text-slate-600",
    },
    blue: {
      badge: "bg-blue-50 text-blue-600 border-blue-100",
      notice: "bg-blue-50 border-blue-100 text-blue-900",
      text: "text-blue-600",
    },
    rose: {
      badge: "bg-rose-50 text-rose-600 border-rose-100",
      notice: "bg-rose-50 border-rose-100 text-rose-900",
      text: "text-rose-600",
    },
  };
  return tones[tone][variant];
}

/**
 * Derives all trust-related UI state for a seller profile.
 * Single source of truth ?" use this everywhere seller trust is displayed.
 */
export function getSellerTrustUI(profile: Partial<Profile> | null | undefined) {
  const restrictionState = getProfileRestrictionState(profile);

  const isApproved = profile?.verificationStatus === "approved";
  const isIdentityVerified = profile?.isVerified === true;
  const isActiveState = restrictionState === "active";

  const isTrusted = isActiveState && (isApproved || isIdentityVerified);

  // Safety Floor: accounts below 40 trust score lose premium markers
  const meetsSafetyFloor = profile?.trustScore === undefined || profile.trustScore >= 40;

  let trustLabel: string = trust.unverified;
  if (isApproved) {
    trustLabel = trust.verifiedBusiness;
  } else if (isIdentityVerified) {
    trustLabel = trust.identityVerified;
  } else if (restrictionState === "restricted_review") {
    trustLabel = trust.verificationPending;
  }

  let statusLabel: string | undefined;
  if (restrictionState === "banned") {
    statusLabel = trust.restricted;
  } else if (restrictionState === "restricted_review") {
    statusLabel = trust.verificationPending;
  }

  let tone: TrustTone = "amber";
  if (restrictionState === "banned") {
    tone = "rose";
  } else if (restrictionState === "restricted_review") {
    tone = "slate";
  } else if (isApproved && meetsSafetyFloor) {
    tone = "emerald";
  } else if (isIdentityVerified && meetsSafetyFloor) {
    tone = "blue";
  }

  const subMessage =
    restrictionState === "restricted_review"
      ? trust.verificationPendingDesc
      : restrictionState === "banned"
        ? trust.accountRestrictedDesc
        : undefined;

  return {
    restrictionState,
    isTrusted: isTrusted && meetsSafetyFloor,
    isApproved,
    isIdentityVerified,
    label: statusLabel || trustLabel,
    trustLabel,
    statusLabel,
    tone,
    styles: trustThemes[tone],
    subMessage,
    isContactable: isActiveState,
    isPremiumVisible: isApproved && isActiveState && meetsSafetyFloor,
    isProfessional: profile?.userType === "professional",
  };
}
