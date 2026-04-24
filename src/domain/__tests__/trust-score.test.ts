import { describe, expect, it } from "vitest";

import { TrustScoreCalculator } from "../logic/trust-score-calculator";

describe("TrustScoreCalculator", () => {
  it("should start with base score of 50", () => {
    const score = TrustScoreCalculator.calculate({});
    expect(score).toBe(50);
  });

  it("should increase score for verified attributes", () => {
    const score = TrustScoreCalculator.calculate({
      emailVerified: true,
      isVerified: true,
      isWalletVerified: true,
    });
    expect(score).toBe(100); // 50 + 10 + 20 + 20 = 100
  });

  it("should add bonus for professional users", () => {
    const score = TrustScoreCalculator.calculate({
      userType: "professional",
    });
    expect(score).toBe(60); // 50 + 10
  });

  it("should drop score to 0 if banned", () => {
    const score = TrustScoreCalculator.calculate({
      isVerified: true,
      isBanned: true,
    });
    expect(score).toBe(0);
  });

  it("should cap score to 30 if restricted", () => {
    const score = TrustScoreCalculator.calculate({
      isVerified: true,
      isWalletVerified: true,
      restrictionState: "restricted_review",
    });
    expect(score).toBe(30);
  });

  it("should always return value between 0 and 100", () => {
    const minScore = TrustScoreCalculator.calculate({ isBanned: true });
    const maxScore = TrustScoreCalculator.calculate({
      emailVerified: true,
      isVerified: true,
      isWalletVerified: true,
      userType: "professional",
    });
    expect(minScore).toBeGreaterThanOrEqual(0);
    expect(maxScore).toBeLessThanOrEqual(100);
  });
});
