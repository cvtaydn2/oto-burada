import type { Profile } from "@/types";

export class TrustScoreCalculator {
  static calculate(profile: Partial<Profile>): number {
    let score = 50; // Base score

    if (profile.emailVerified) score += 10;
    if (profile.isVerified) score += 20;
    if (profile.isWalletVerified) score += 20;
    if (profile.userType === "professional") score += 10;

    // Penalties
    if (profile.isBanned) score = 0;
    if (profile.restrictionState === "restricted_review") score = Math.min(score, 30);

    return Math.max(0, Math.min(100, score));
  }
}
