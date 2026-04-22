import { describe, expect, it } from "vitest";

import { Profile } from "@/types";

import { getSellerTrustSummary } from "../profile-trust";

describe("profile-trust logic", () => {
  const mockProfile: Profile = {
    id: "user-1",
    fullName: "Cevat Aydın",
    phone: "905551112233",
    city: "İstanbul",
    emailVerified: false,
    isVerified: false,
    role: "user",
    createdAt: "2022-01-01T00:00:00Z",
    updatedAt: "2022-01-01T00:00:00Z",
  };

  it("should return default summary if seller is null", () => {
    const result = getSellerTrustSummary(null, 0);
    expect(result.score).toBe(0);
    expect(result.signals).toHaveLength(0);
    expect(result.badgeLabel).toBeNull();
  });

  it("should calculate base score for an older unverified profile correctly", () => {
    const result = getSellerTrustSummary(mockProfile, 0);
    expect(result.score).toBe(30);
    expect(result.signals).toContain("4+ yıl hesap geçmişi");
    expect(result.badgeLabel).toBeNull();
  });

  it("should boost score for verified email and include the signal", () => {
    const result = getSellerTrustSummary(
      {
        ...mockProfile,
        emailVerified: true,
        verificationReviewedAt: "2026-01-01T00:00:00Z",
      },
      0
    );
    expect(result.badgeLabel).toBeNull();
    expect(result.score).toBe(40);
    expect(result.signals).toContain("E-posta onaylı");
  });

  it("should assign verified seller badge for active identity-verified users", () => {
    const result = getSellerTrustSummary(
      {
        ...mockProfile,
        emailVerified: true,
        isVerified: true,
        verificationReviewedAt: "2026-01-01T00:00:00Z",
      },
      0
    );
    expect(result.badgeLabel).toBe("Doğrulanmış Satıcı");
    expect(result.score).toBe(60);
    expect(result.signals).toContain("Kimlik doğrulandı");
  });

  it("should assign business badge for recently approved verification", () => {
    const result = getSellerTrustSummary(
      {
        ...mockProfile,
        emailVerified: true,
        verificationStatus: "approved",
        verificationReviewedAt: "2026-01-01T00:00:00Z",
      },
      0
    );
    expect(result.badgeLabel).toBe("Doğrulanmış İşletme");
    expect(result.score).toBe(75);
    expect(result.signals).toContain("İşletme doğrulandı");
  });

  it("should reflect active listing count in signals", () => {
    const countSummary = getSellerTrustSummary(mockProfile, 10);
    expect(countSummary.signals).toContain("10 aktif ilan geçmişi");
  });
});
