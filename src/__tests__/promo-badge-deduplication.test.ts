import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = path.resolve(__dirname, "../..");

function read(relativePath: string) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

describe("promotion badge deduplication guardrail", () => {
  it("audited surfaces use the shared promo badge renderer or shared display helper", () => {
    const files = [
      "src/components/listings/listing-detail/listing-gallery-section.tsx",
      "src/components/listings/favorites-page-client.tsx",
      "src/components/admin/inventory-table.tsx",
      "src/app/(public)/(marketplace)/listing/[slug]/page.tsx",
    ];

    files.forEach((file) => {
      const source = read(file);
      expect(
        source.includes("ListingPromoBadges") || source.includes("getListingDopingDisplayItems")
      ).toBe(true);
    });
  });

  it("seller stats use shared doping interpretation instead of raw featured flag counting", () => {
    const source = read("src/app/(public)/(marketplace)/seller/[id]/page.tsx");

    expect(source).toContain("getListingDopingDisplayItems");
    expect(source).toContain("Aktif Vitrin");
    expect(source).not.toContain("listing.featured).length");
  });
});
