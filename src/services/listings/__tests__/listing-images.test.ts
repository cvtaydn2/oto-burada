import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  formatFileSize,
  getListingImageConstraintsText,
  validateListingImageFile,
  buildListingImageStoragePath
} from "../listing-images";

vi.mock("@/lib/constants/domain", () => ({
  listingImageAcceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  listingImageMaxSizeInBytes: 10 * 1024 * 1024, // 10MB
}));

describe("Listing Images Service", () => {
  describe("formatFileSize", () => {
    it("should format bytes to MB", () => {
      expect(formatFileSize(1024 * 1024)).toBe("1 MB");
      expect(formatFileSize(5 * 1024 * 1024)).toBe("5 MB");
      expect(formatFileSize(10 * 1024 * 1024)).toBe("10 MB");
    });
  });

  describe("getListingImageConstraintsText", () => {
    it("should return constraints text", () => {
      const text = getListingImageConstraintsText();
      expect(text).toContain("JPEG");
      expect(text).toContain("PNG");
      expect(text).toContain("WEBP");
      expect(text).toContain("10 MB");
    });
  });

  describe("validateListingImageFile", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should return error for invalid mime type", async () => {
      const mockFile = new File([""], "test.txt", { type: "text/plain" });
      const result = await validateListingImageFile(mockFile);
      expect(result).toContain("JPG");
    });

    it("should return error for file too large", async () => {
      const mockFile = new File([""], "test.jpg", { type: "image/jpeg" });
      vi.spyOn(mockFile, "size", "get").mockReturnValue(20 * 1024 * 1024); // 20MB
      const result = await validateListingImageFile(mockFile);
      expect(result).toContain("10 MB");
    });
  });

  describe("buildListingImageStoragePath", () => {
    it("should build correct storage path", () => {
      const result = buildListingImageStoragePath("user-123", "test.jpg");
      expect(result).toContain("listings/user-123/");
      expect(result).toContain(".jpg");
    });

    it("should handle files without extension", () => {
      const result = buildListingImageStoragePath("user-123", "testfile");
      expect(result).toContain("listings/user-123/");
      expect(result).toContain(".jpg");
    });
  });
});