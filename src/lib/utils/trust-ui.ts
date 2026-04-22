import { trust } from "@/lib/constants/ui-strings";
import { getProfileRestrictionState } from "@/services/profile/profile-restrictions";
import type { Profile } from "@/types";

import { trustThemes } from "./trust-helpers";

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
    label: statusLabel || trustLabel, // Maintain backward compatibility for single-slot UIs
    trustLabel,
    statusLabel,
    tone,
    styles: trustThemes[tone],
    subMessage,
    isContactable: isActive,
    isPremiumVisible: isApproved && isActive && meetsSafetyFloor,
    // Professional type is a static attribute, not a trust state
    isProfessional: profile?.userType === "professional",
  };
}
