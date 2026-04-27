/**
 * Unit tests for Listing Creation Use Case
 * Tests BUG-05: trackEvent Synchronous Exception Handling
 */

import { describe, expect, it, vi } from "vitest";

import type { ListingCreateInput } from "@/types";

import { executeListingCreation } from "../listing-create";

describe("executeListingCreation", () => {
  const mockInput: ListingCreateInput = {
    title: "Test Car",
    brand: "Toyota",
    model: "Corolla",
    year: 2020,
    mileage: 50000,
    fuelType: "benzin",
    transmission: "otomatik",
    price: 500000,
    city: "Istanbul",
    district: "Kadikoy",
    description: "Test description",
    whatsappPhone: "+905551234567",
    vin: "1234567890ABCDEFG",
    images: [
      {
        url: "https://example.com/image.jpg",
        storagePath: "listings/user-id/image.jpg",
        order: 0,
        isCover: true,
      },
    ],
  };

  const mockListing = {
    id: "listing-123",
    slug: "toyota-corolla-2020",
    sellerId: "user-123",
    ...mockInput,
    status: "pending_ai_review" as const,
    viewCount: 0,
    version: 0,
    featured: false,
    fraudScore: 0,
    fraudReason: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe("BUG-05: trackEvent Exception Handling", () => {
    it("should not fail listing creation if trackEvent throws", async () => {
      const deps = {
        checkQuota: vi.fn().mockResolvedValue({ allowed: true }),
        getExistingListings: vi.fn().mockResolvedValue([]),
        runTrustGuards: vi.fn().mockResolvedValue({ allowed: true }),
        saveListing: vi.fn().mockResolvedValue({ listing: mockListing }),
        notifyUser: vi.fn().mockResolvedValue(undefined),
        trackEvent: vi.fn().mockImplementation(() => {
          throw new Error("Analytics service unavailable");
        }),
        runAsyncModeration: vi.fn(),
      };

      const result = await executeListingCreation(mockInput, "user-123", deps);

      expect(result.success).toBe(true);
      expect(result.listing).toBeDefined();
      expect(deps.trackEvent).toHaveBeenCalled();
      expect(deps.saveListing).toHaveBeenCalled();
    });

    it("should not fail if notifyUser rejects", async () => {
      const deps = {
        checkQuota: vi.fn().mockResolvedValue({ allowed: true }),
        getExistingListings: vi.fn().mockResolvedValue([]),
        runTrustGuards: vi.fn().mockResolvedValue({ allowed: true }),
        saveListing: vi.fn().mockResolvedValue({ listing: mockListing }),
        notifyUser: vi.fn().mockRejectedValue(new Error("Notification failed")),
        trackEvent: vi.fn(),
        runAsyncModeration: vi.fn(),
      };

      const result = await executeListingCreation(mockInput, "user-123", deps);

      expect(result.success).toBe(true);
      expect(result.listing).toBeDefined();
    });

    it("should call all side effects even if one fails", async () => {
      const deps = {
        checkQuota: vi.fn().mockResolvedValue({ allowed: true }),
        getExistingListings: vi.fn().mockResolvedValue([]),
        runTrustGuards: vi.fn().mockResolvedValue({ allowed: true }),
        saveListing: vi.fn().mockResolvedValue({ listing: mockListing }),
        notifyUser: vi.fn().mockRejectedValue(new Error("Notification failed")),
        trackEvent: vi.fn().mockImplementation(() => {
          throw new Error("Analytics failed");
        }),
        runAsyncModeration: vi.fn(),
      };

      const result = await executeListingCreation(mockInput, "user-123", deps);

      expect(result.success).toBe(true);
      expect(deps.notifyUser).toHaveBeenCalled();
      expect(deps.trackEvent).toHaveBeenCalled();
      expect(deps.runAsyncModeration).toHaveBeenCalled();
    });
  });

  describe("Business Rules", () => {
    it("should reject if quota exceeded", async () => {
      const deps = {
        checkQuota: vi.fn().mockResolvedValue({
          allowed: false,
          reason: "Monthly limit reached",
        }),
        getExistingListings: vi.fn(),
        runTrustGuards: vi.fn(),
        saveListing: vi.fn(),
        notifyUser: vi.fn(),
        trackEvent: vi.fn(),
        runAsyncModeration: vi.fn(),
      };

      const result = await executeListingCreation(mockInput, "user-123", deps);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("QUOTA_EXCEEDED");
      expect(deps.saveListing).not.toHaveBeenCalled();
    });

    it("should reject if trust guards fail", async () => {
      const deps = {
        checkQuota: vi.fn().mockResolvedValue({ allowed: true }),
        getExistingListings: vi.fn().mockResolvedValue([]),
        runTrustGuards: vi.fn().mockResolvedValue({
          allowed: false,
          message: "Suspicious activity detected",
        }),
        saveListing: vi.fn(),
        notifyUser: vi.fn(),
        trackEvent: vi.fn(),
        runAsyncModeration: vi.fn(),
      };

      const result = await executeListingCreation(mockInput, "user-123", deps);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("TRUST_GUARD_REJECTION");
      expect(deps.saveListing).not.toHaveBeenCalled();
    });

    it("should handle slug collision", async () => {
      const deps = {
        checkQuota: vi.fn().mockResolvedValue({ allowed: true }),
        getExistingListings: vi.fn().mockResolvedValue([]),
        runTrustGuards: vi.fn().mockResolvedValue({ allowed: true }),
        saveListing: vi.fn().mockResolvedValue({ error: "slug_collision" }),
        notifyUser: vi.fn(),
        trackEvent: vi.fn(),
        runAsyncModeration: vi.fn(),
      };

      const result = await executeListingCreation(mockInput, "user-123", deps);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("SLUG_COLLISION");
    });

    it("should handle database errors", async () => {
      const deps = {
        checkQuota: vi.fn().mockResolvedValue({ allowed: true }),
        getExistingListings: vi.fn().mockResolvedValue([]),
        runTrustGuards: vi.fn().mockResolvedValue({ allowed: true }),
        saveListing: vi.fn().mockResolvedValue({ error: "db_error" }),
        notifyUser: vi.fn(),
        trackEvent: vi.fn(),
        runAsyncModeration: vi.fn(),
      };

      const result = await executeListingCreation(mockInput, "user-123", deps);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("DB_ERROR");
    });
  });

  describe("Happy Path", () => {
    it("should successfully create listing with all side effects", async () => {
      const deps = {
        checkQuota: vi.fn().mockResolvedValue({ allowed: true }),
        getExistingListings: vi.fn().mockResolvedValue([]),
        runTrustGuards: vi.fn().mockResolvedValue({ allowed: true }),
        saveListing: vi.fn().mockResolvedValue({ listing: mockListing }),
        notifyUser: vi.fn().mockResolvedValue(undefined),
        trackEvent: vi.fn(),
        runAsyncModeration: vi.fn(),
      };

      const result = await executeListingCreation(mockInput, "user-123", deps);

      expect(result.success).toBe(true);
      expect(result.listing).toEqual(mockListing);
      expect(deps.checkQuota).toHaveBeenCalledWith("user-123");
      expect(deps.runTrustGuards).toHaveBeenCalledWith(mockInput);
      expect(deps.saveListing).toHaveBeenCalled();
      expect(deps.notifyUser).toHaveBeenCalledWith(mockListing);
      expect(deps.trackEvent).toHaveBeenCalledWith(mockListing);
      expect(deps.runAsyncModeration).toHaveBeenCalledWith(mockListing.id, mockListing);
    });
  });
});
