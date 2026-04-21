import type { Profile } from "@/types";

export type ProfileRestrictionState = "active" | "restricted_review" | "banned";

const TEMP_RESTRICTION_MARKERS = [
  "Geçici güvenlik kısıtı",
  "Admin incelemesi gerekiyor",
];

export function getProfileRestrictionState(profile: Partial<Profile> | null | undefined): ProfileRestrictionState {
  if (!profile?.isBanned) {
    return "active";
  }

  const reason = profile.banReason ?? "";
  if (TEMP_RESTRICTION_MARKERS.some((marker) => reason.includes(marker))) {
    return "restricted_review";
  }

  return "banned";
}

export function isProfileTrustedForBadges(profile: Partial<Profile> | null | undefined) {
  return getProfileRestrictionState(profile) === "active";
}
