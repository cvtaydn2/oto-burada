import { beforeEach, describe, expect, it, vi } from "vitest";

import { getListingDopingDisplayItems, getListingDopingStatusTone } from "@/lib/listings/utils";
import type { Listing } from "@/types";

function createListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "listing-1",
    slug: "listing-1",
    sellerId: "seller-1",
    title: "2020 BMW 320i M Sport",
    brand: "BMW",
    model: "320i",
    category: "otomobil",
    year: 2020,
    price: 1500000,
    status: "approved",
    mileage: 85000,
    fuelType: "benzin",
    transmission: "otomatik",
    city: "İstanbul",
    district: "Kadıköy",
    description: "Temiz araç",
    whatsappPhone: "+905551112233",
    version: 1,
    featured: false,
    images: [],
    viewCount: 0,
    createdAt: "2026-05-01T10:00:00.000Z",
    updatedAt: "2026-05-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("listing promo helpers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-05T12:00:00.000Z"));
  });

  it("derives active doping display items in a stable user-facing format", () => {
    const listing = createListing({
      urgentUntil: "2026-05-10T12:00:00.000Z",
      homepageShowcaseUntil: "2026-05-09T12:00:00.000Z",
      boldFrameUntil: "2026-05-08T12:00:00.000Z",
      bumpedAt: "2026-05-05T02:00:00.000Z",
    });

    const items = getListingDopingDisplayItems(listing);

    expect(items).toEqual([
      {
        type: "urgent",
        label: "Acil Acil",
        expiresAt: "2026-05-10T12:00:00.000Z",
      },
      {
        type: "homepage_showcase",
        label: "Anasayfa Vitrini",
        expiresAt: "2026-05-09T12:00:00.000Z",
      },
      {
        type: "bold_frame",
        label: "Kalın Yazı & Renkli Çerçeve",
        expiresAt: "2026-05-08T12:00:00.000Z",
      },
      {
        type: "bump",
        label: "Güncelim",
        expiresAt: "2026-05-05T02:00:00.000Z",
      },
    ]);
  });

  it("ignores expired doping fields", () => {
    const listing = createListing({
      urgentUntil: "2026-05-04T12:00:00.000Z",
      homepageShowcaseUntil: "2026-05-01T12:00:00.000Z",
      bumpedAt: "2026-05-01T02:00:00.000Z",
    });

    expect(getListingDopingDisplayItems(listing)).toEqual([]);
  });

  it("marks near-expiry effects as expiring", () => {
    expect(getListingDopingStatusTone("2026-05-06T00:00:00.000Z")).toBe("expiring");
  });

  it("marks longer-running effects as active", () => {
    expect(getListingDopingStatusTone("2026-05-12T00:00:00.000Z")).toBe("active");
  });

  it("treats missing or invalid expiry as single-use", () => {
    expect(getListingDopingStatusTone(null)).toBe("single_use");
    expect(getListingDopingStatusTone("not-a-date")).toBe("single_use");
  });
});
