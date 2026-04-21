import { trust } from "@/lib/constants/ui-strings";
import { getProfileRestrictionState } from "@/services/profile/profile-restrictions";
import type { Profile } from "@/types";

/**
 * Single Source of Truth for Seller Trust UI Rendering
 */
export function getSellerTrustUI(profile: Partial<Profile> | null | undefined) {
  const restrictionState = getProfileRestrictionState(profile);
  
  const isApproved = profile?.verificationStatus === "approved";
  const isIdentityVerified = profile?.isVerified === true;
  const isActive = restrictionState === "active";
  
  // High-level Trust Signal
  const isTrusted = isActive && (isApproved || isIdentityVerified);

  // Safety Floor (40 points): Accounts below this score are stripped of premium markers.
  const meetsSafetyFloor = profile?.trustScore === undefined || profile.trustScore >= 40;

  // 1. Trust Badge Label (Public Brand Trust)
  let trustLabel: string = trust.unverified;
  if (isApproved) {
    trustLabel = trust.verifiedBusiness;
  } else if (isIdentityVerified) {
    trustLabel = trust.identityVerified;
  } else if (restrictionState === "restricted_review") {
    trustLabel = trust.verificationPending;
  }

  // 2. Status Label (Operational State)
  let statusLabel: string | undefined = undefined;
  if (restrictionState === "banned") {
    statusLabel = trust.restricted;
  } else if (restrictionState === "restricted_review") {
    statusLabel = trust.verificationPending;
  }

  // 3. Visual Tone Logic
  let tone: "emerald" | "amber" | "slate" | "blue" | "rose" = "amber";
  if (restrictionState === "banned") {
    tone = "rose";
  } else if (restrictionState === "restricted_review") {
    tone = "slate";
  } else if (isApproved && meetsSafetyFloor) {
    tone = "emerald";
  } else if (isIdentityVerified && meetsSafetyFloor) {
    tone = "blue";
  }

  const themes = {
    emerald: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-600",
      border: "border-emerald-500/20",
      dot: "bg-emerald-500",
      notice: "bg-emerald-50 border-emerald-100 text-emerald-900"
    },
    amber: {
      bg: "bg-amber-500/10",
      text: "text-amber-700",
      border: "border-amber-500/20",
      dot: "bg-amber-500",
      notice: "bg-amber-50 border-amber-100 text-amber-900"
    },
    slate: {
      bg: "bg-slate-500/10",
      text: "text-slate-700",
      border: "border-slate-500/20",
      dot: "bg-slate-500",
      notice: "bg-slate-50 border-slate-100 text-slate-900"
    },
    blue: {
      bg: "bg-blue-500/10",
      text: "text-blue-600",
      border: "border-blue-500/20",
      dot: "bg-blue-500",
      notice: "bg-blue-50 border-blue-100 text-blue-900"
    },
    rose: {
      bg: "bg-rose-500/10",
      text: "text-rose-600",
      border: "border-rose-500/20",
      dot: "bg-rose-500",
      notice: "bg-rose-50 border-rose-100 text-rose-900"
    }
  } as const;

  const subMessage = restrictionState === "restricted_review" 
    ? trust.verificationPendingDesc 
    : restrictionState === "banned" 
      ? trust.accountRestrictedDesc 
      : undefined;

  return {
    restrictionState,
    isTrusted: isTrusted && meetsSafetyFloor,
    isApproved,
    isIdentityVerified,
    label: statusLabel || trustLabel, // Maintain backward compatibility for single-slot UIs
    trustLabel,
    statusLabel,
    tone,
    styles: themes[tone],
    subMessage,
    isContactable: isActive,
    isPremiumVisible: isApproved && isActive && meetsSafetyFloor,
    // Professional type is a static attribute, not a trust state
    isProfessional: profile?.userType === "professional"
  };
}
