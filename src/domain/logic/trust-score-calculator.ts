import type { Profile } from "@/types";

/**
 * Trust score algorithm (0-100):
 * - Base score: 50
 * - Email verified: +10
 * - Identity / primary verification (`isVerified`): +20
 * - Wallet / secondary verification (`isWalletVerified`): +20
 * - Professional seller: +10
 * - Banned users: forced to 0
 * - `restricted_review`: capped to 30
 *
 * This logic is intentionally simple and deterministic for MVP moderation UX.
 */
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
