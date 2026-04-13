import { describe, it, expect } from "vitest";

describe.skip("Gallery Service", () => {
  it("should get gallery by slug", async () => {
    const { getGalleryBySlug } = await import("../index");
    expect(getGalleryBySlug).toBeDefined();
  });

  it("should get gallery by ID", async () => {
    const { getGalleryById } = await import("../index");
    expect(getGalleryById).toBeDefined();
  });
});