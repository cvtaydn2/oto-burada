import { describe, it, expect } from "vitest";

describe.skip("Admin Inventory Service", () => {
  it("should get admin inventory", async () => {
    const { getAdminInventory } = await import("../inventory");
    expect(getAdminInventory).toBeDefined();
  });

  it("should force action on listing", async () => {
    const { forceActionOnListing } = await import("../inventory");
    expect(forceActionOnListing).toBeDefined();
  });
});