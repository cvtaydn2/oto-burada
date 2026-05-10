import { Profile } from "@/types";

export interface ProfilePageData {
  profile: Profile;
  completionPercentage: number;
  statusCounts: {
    hasFullName: boolean;
    hasPhone: boolean;
    hasCity: boolean;
  };
  normalizedValues: {
    fullName: string;
    phone: string;
    city: string;
    avatarUrl: string;
  };
}

/**
 * Orchestrates preparation of the dashboard view model.
 * Pure function - accepts inputs and formats them for UI, computing completion.
 */
export function buildProfilePageData(profile: Profile): ProfilePageData {
  const hasFullName = Boolean(profile.fullName?.trim());
  const hasPhone = Boolean(profile.phone?.trim());
  const hasCity = Boolean(profile.city?.trim());

  const metrics = [hasFullName, hasPhone, hasCity];
  const completionPercentage = Math.round((metrics.filter(Boolean).length / metrics.length) * 100);

  return {
    profile,
    completionPercentage,
    statusCounts: {
      hasFullName,
      hasPhone,
      hasCity,
    },
    normalizedValues: {
      fullName: profile.fullName ?? "",
      phone: profile.phone ?? "",
      city: profile.city ?? "",
      avatarUrl: profile.avatarUrl ?? "",
    },
  };
}
