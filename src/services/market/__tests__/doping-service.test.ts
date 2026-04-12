import { describe, it, expect } from 'vitest';

describe.skip("Doping Service", () => {
  it("should handle doping application gracefully", async () => {
    const { applyDopingToListing } = await import('../doping-service');
    const result = await applyDopingToListing("test-listing", "test-user", ["featured"]);
    expect(result).toBeDefined();
  });
});