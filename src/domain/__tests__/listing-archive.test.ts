import { beforeEach, describe, expect, it, vi } from "vitest";

import * as persistence from "@/services/listings/listing-submission-persistence";
import type { Listing } from "@/types";

import { archiveListingUseCase } from "../usecases/listing-archive";

vi.mock("@/services/listings/listing-submission-persistence", () => ({
  archiveListing: vi.fn(),
}));

describe("archiveListingUseCase", () => {
  const mockListingId = "listing-123";
  const mockSellerId = "seller-456";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error if transition is not allowed", async () => {
    const result = await archiveListingUseCase(mockListingId, mockSellerId, "archived");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Cannot archive listing");
    expect(persistence.archiveListing).not.toHaveBeenCalled();
  });

  it("should return success when persistence succeeds", async () => {
    const mockListing = { id: mockListingId, status: "archived" };
    vi.mocked(persistence.archiveListing).mockResolvedValue({
      listing: mockListing as unknown as Listing,
    });

    const result = await archiveListingUseCase(mockListingId, mockSellerId, "approved");

    expect(result.success).toBe(true);
    expect(result.listing).toEqual(mockListing);
    expect(persistence.archiveListing).toHaveBeenCalledWith(mockListingId, mockSellerId);
  });

  it("should handle concurrent update error from persistence", async () => {
    vi.mocked(persistence.archiveListing).mockResolvedValue({
      error: "concurrent_update_detected",
    });

    const result = await archiveListingUseCase(mockListingId, mockSellerId, "approved");

    expect(result.success).toBe(false);
    expect(result.error).toContain("modified by another process");
  });

  it("should handle generic persistence error", async () => {
    vi.mocked(persistence.archiveListing).mockResolvedValue({
      error: "database_error",
    });

    const result = await archiveListingUseCase(mockListingId, mockSellerId, "approved");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to archive listing.");
  });
});
