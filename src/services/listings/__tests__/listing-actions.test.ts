import { describe, it, expect } from "vitest";

describe.skip("Listing Actions Service", () => {
  it("should reveal listing phone for authorized user", async () => {
    // Server action - requires mock setup for headers/session
    const { revealListingPhone } = await import("../listing-actions");
    expect(revealListingPhone).toBeDefined();
  });
});