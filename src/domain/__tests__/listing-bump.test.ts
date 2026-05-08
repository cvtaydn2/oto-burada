import { describe, expect, it, vi } from "vitest";

import * as persistence from "@/features/marketplace/services/listing-submission-persistence";

import { bumpListingUseCase } from "../usecases/listing-bump";

vi.mock("@/features/marketplace/services/listing-submission-persistence", () => ({
  bumpListing: vi.fn(),
}));

describe("bumpListingUseCase", () => {
  it("should fail if listing is not approved", async () => {
    const result = await bumpListingUseCase("id", "seller", { status: "pending" });
    expect(result.error).toContain("Only approved listings");
  });

  it("should fail if bumped within last 24 hours", async () => {
    const recentDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
    const result = await bumpListingUseCase("id", "seller", {
      status: "approved",
      bumpedAt: recentDate,
    });

    expect(result.error).toContain("can be bumped again in 22 hours");
  });

  it("should succeed if cooldown has passed", async () => {
    const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(); // 25 hours ago
    vi.mocked(persistence.bumpListing).mockResolvedValueOnce({
      listing: {
        id: "id",
        bumpedAt: new Date().toISOString(),
      } as unknown as import("@/types").Listing,
    });

    const result = await bumpListingUseCase("id", "seller", {
      status: "approved",
      bumpedAt: oldDate,
    });

    expect(result.listing).toBeDefined();
    expect(persistence.bumpListing).toHaveBeenCalled();
  });

  it("should succeed if never bumped before", async () => {
    vi.mocked(persistence.bumpListing).mockResolvedValueOnce({
      listing: {
        id: "id",
        bumpedAt: new Date().toISOString(),
      } as unknown as import("@/types").Listing,
    });

    const result = await bumpListingUseCase("id", "seller", {
      status: "approved",
      bumpedAt: null,
    });

    expect(result.listing).toBeDefined();
  });
});
