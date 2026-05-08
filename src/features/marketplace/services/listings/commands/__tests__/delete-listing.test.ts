/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unit tests for Delete Listing Command
 * Tests BUG-09: Meaningful Error Returns
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the dependencies
vi.mock("../../listing-submission-persistence", () => ({
  deleteListing: vi.fn(),
}));

vi.mock("../../queries/get-listings", () => ({
  getStoredListingById: vi.fn(),
}));

vi.mock("@/lib/registry", () => ({
  queueFileCleanup: vi.fn().mockResolvedValue(undefined),
}));

import { deleteListing } from "../../listing-submission-persistence";
import { getStoredListingById } from "../../queries/get-listings";
import { deleteDatabaseListing } from "../delete-listing";

describe("deleteDatabaseListing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("BUG-09: Meaningful Error Returns", () => {
    it("should return NOT_FOUND error when listing does not exist", async () => {
      (getStoredListingById as any).mockResolvedValue(null);

      const result = await deleteDatabaseListing("listing-123", "user-123");

      expect(result).toEqual({
        error: "NOT_FOUND",
        message: "İlan bulunamadı veya size ait değil.",
      });
    });

    it("should return NOT_FOUND error when seller does not match", async () => {
      (getStoredListingById as any).mockResolvedValue({
        id: "listing-123",
        sellerId: "different-user",
        status: "archived",
        images: [],
      });

      const result = await deleteDatabaseListing("listing-123", "user-123");

      expect(result).toEqual({
        error: "NOT_FOUND",
        message: "İlan bulunamadı veya size ait değil.",
      });
    });

    it("should return NOT_ARCHIVED error when listing is not archived", async () => {
      (getStoredListingById as any).mockResolvedValue({
        id: "listing-123",
        sellerId: "user-123",
        status: "approved",
        images: [],
      });

      const result = await deleteDatabaseListing("listing-123", "user-123");

      expect(result).toEqual({
        error: "NOT_ARCHIVED",
        message: "Sadece arşivlenmiş ilanlar silinebilir.",
      });
    });

    it("should return CONFLICT error on concurrent update", async () => {
      (getStoredListingById as any).mockResolvedValue({
        id: "listing-123",
        sellerId: "user-123",
        status: "archived",
        version: 5,
        images: [],
      });

      (deleteListing as any).mockResolvedValue({
        success: false,
        error: "concurrent_update_detected",
      });

      const result = await deleteDatabaseListing("listing-123", "user-123");

      expect(result).toEqual({
        error: "CONFLICT",
      });
    });

    it("should successfully delete archived listing", async () => {
      (getStoredListingById as any).mockResolvedValue({
        id: "listing-123",
        sellerId: "user-123",
        status: "archived",
        version: 5,
        images: [],
      });

      (deleteListing as any).mockResolvedValue({
        success: true,
      });

      const result = await deleteDatabaseListing("listing-123", "user-123");

      expect(result).toEqual({
        id: "listing-123",
        deleted: true,
      });
    });

    it("should queue storage cleanup for listings with images", async () => {
      const { queueFileCleanup } = await import("@/lib/registry");

      (getStoredListingById as any).mockResolvedValue({
        id: "listing-123",
        sellerId: "user-123",
        status: "archived",
        version: 5,
        images: [
          { storagePath: "listings/user-123/image1.jpg" },
          { storagePath: "listings/user-123/image2.jpg" },
        ],
      });

      (deleteListing as any).mockResolvedValue({
        success: true,
      });

      const result = await deleteDatabaseListing("listing-123", "user-123");

      expect(result).toEqual({
        id: "listing-123",
        deleted: true,
      });

      // Wait for async cleanup to be queued
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(queueFileCleanup).toHaveBeenCalledWith(expect.any(String), [
        "listings/user-123/image1.jpg",
        "listings/user-123/image2.jpg",
      ]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle listings with empty storage paths", async () => {
      (getStoredListingById as any).mockResolvedValue({
        id: "listing-123",
        sellerId: "user-123",
        status: "archived",
        version: 5,
        images: [{ storagePath: "" }, { storagePath: "listings/user-123/image.jpg" }],
      });

      (deleteListing as any).mockResolvedValue({
        success: true,
      });

      const result = await deleteDatabaseListing("listing-123", "user-123");

      expect(result).toEqual({
        id: "listing-123",
        deleted: true,
      });
    });

    it("should handle deletion failure", async () => {
      (getStoredListingById as any).mockResolvedValue({
        id: "listing-123",
        sellerId: "user-123",
        status: "archived",
        version: 5,
        images: [],
      });

      (deleteListing as any).mockResolvedValue({
        success: false,
      });

      const result = await deleteDatabaseListing("listing-123", "user-123");

      expect(result).toBeNull();
    });
  });
});
