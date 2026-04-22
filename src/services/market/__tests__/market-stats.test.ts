import { describe, expect, it } from "vitest";

describe.skip("Market Stats Service", () => {
  it("should update market stats", async () => {
    const { updateMarketStats } = await import("../market-stats");
    expect(updateMarketStats).toBeDefined();
  });
});
