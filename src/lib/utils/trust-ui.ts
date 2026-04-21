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

  // 1. Badge Label Logic
  let label: string = trust.unverified;
  if (restrictionState === "restricted_review") {
    label = trust.verificationPending;
  } else if (restrictionState === "banned") {
    label = trust.restricted;
  } else if (isApproved) {
    label = trust.verifiedBusiness;
  } else if (isIdentityVerified) {
    label = trust.identityVerified;
  }

  // 2. Visual Tone Logic
  let tone: "emerald" | "amber" | "slate" | "blue" = "amber";
  if (restrictionState !== "active") {
    tone = "slate"; // High risk/Review
  } else if (isApproved && meetsSafetyFloor) {
    tone = "emerald"; // High trust
  } else if (isIdentityVerified && meetsSafetyFloor) {
    tone = "blue"; // Identity confirmed
  } else {
    tone = "amber"; // Low trust/Unverified/Below Floor
  }

  return {
    restrictionState,
    isTrusted: isTrusted && meetsSafetyFloor,
    isApproved,
    isIdentityVerified,
    label,
    tone,
    isContactable: isActive,
    isPremiumVisible: isApproved && isActive && meetsSafetyFloor,
    isProfessional: profile?.userType === "professional" && isApproved && isActive && meetsSafetyFloor
  };
}
