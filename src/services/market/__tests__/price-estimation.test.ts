import { describe, it, expect, vi } from "vitest";

describe.skip("Price Estimation Service", () => {
  it("should estimate vehicle price", async () => {
    const { estimateVehiclePrice } = await import("../price-estimation");
    expect(estimateVehiclePrice).toBeDefined();
  });
});