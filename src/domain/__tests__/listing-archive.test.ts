import { describe, expect, it, vi } from "vitest";

import * as persistence from "@/services/listings/listing-submission-persistence";

import { archiveListingUseCase } from "../usecases/listing-archive";

vi.mock("@/services/listings/listing-submission-persistence", () => ({
  archiveListing: vi.fn(),
}));

describe("archiveListingUseCase", () => {
  it("should fail if status machine transition is invalid", async () => {
    const result = await archiveListingUseCase("id", "seller", "draft");
    expect(result.error).toContain("Cannot archive listing");
  });

  it("should call persistence layer if transition is valid", async () => {
    vi.mocked(persistence.archiveListing).mockResolvedValueOnce({
      listing: { id: "id", status: "archived" } as unknown as import("@/types").Listing,
    });

    const result = await archiveListingUseCase("id", "seller", "approved");

    expect(result.listing?.status).toBe("archived");
    expect(persistence.archiveListing).toHaveBeenCalledWith("id", "seller");
  });

  it("should handle concurrency errors from persistence layer", async () => {
    vi.mocked(persistence.archiveListing).mockResolvedValueOnce({
      error: "concurrent_update_detected",
    });

    const result = await archiveListingUseCase("id", "seller", "approved");

    expect(result.error).toContain("modified by another process");
  });
});
