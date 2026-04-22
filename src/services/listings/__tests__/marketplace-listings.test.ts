import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Listing, Profile } from "@/types";

import {
  getAllKnownListings,
  getFilteredMarketplaceListings,
  getMarketplaceListingBySlug,
  getMarketplaceListingsByIds,
  getMarketplaceSeller,
  getPublicMarketplaceListings,
  getSimilarMarketplaceListings,
} from "../marketplace-listings";

const mockListing: Partial<Listing> = {
  id: "1",
  slug: "test-listing",
  sellerId: "seller-1",
  title: "Test Car",
  brand: "BMW",
  model: "320i",
  year: 2023,
  mileage: 50000,
  fuelType: "benzin",
  transmission: "otomatik",
  price: 1500000,
  city: "Istanbul",
  district: "Kadikoy",
  description: "Test",
  whatsappPhone: "+905551234567",
  status: "approved",
  viewCount: 100,
  featured: false,
  images: [],
};

const mockProfile: Partial<Profile> = {
  id: "seller-1",
  fullName: "Test User",
  phone: "+905551234567",
  city: "Istanbul",
  emailVerified: true,
  isVerified: false,
  role: "user",
  createdAt: "2024-01-01",
};

vi.mock("@/services/listings/listing-submissions", () => ({
  getStoredListingBySlug: vi.fn(),
  getStoredListingsByIds: vi.fn(),
}));

vi.mock("@/services/listings/catalog", () => ({
  getPublicListings: vi.fn(),
}));

vi.mock("@/services/profile/profile-records", () => ({
  getStoredProfileById: vi.fn(),
}));

describe("Marketplace Listings Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get filtered marketplace listings", async () => {
    const { getPublicListings } = await import("@/services/listings/catalog");
    vi.mocked(getPublicListings).mockResolvedValue({
      listings: [],
      total: 0,
      page: 1,
      limit: 12,
      hasMore: false,
    });

    const result = await getFilteredMarketplaceListings({ page: 1, limit: 12 });
    expect(result).toBeDefined();
  });

  it("should get marketplace listings by IDs", async () => {
    const { getStoredListingsByIds } = await import("@/services/listings/listing-submissions");
    vi.mocked(getStoredListingsByIds).mockResolvedValue([]);

    const result = await getMarketplaceListingsByIds(["id1", "id2"]);
    expect(result).toEqual([]);
  });

  it("should get marketplace listing by slug", async () => {
    const { getStoredListingBySlug } = await import("@/services/listings/listing-submissions");
    vi.mocked(getStoredListingBySlug).mockResolvedValue(mockListing as unknown as Listing);

    const result = await getMarketplaceListingBySlug("test-listing");
    expect(result).toBeDefined();
  });

  it("should return null for non-approved listing", async () => {
    const { getStoredListingBySlug } = await import("@/services/listings/listing-submissions");
    vi.mocked(getStoredListingBySlug).mockResolvedValue({
      ...mockListing,
      status: "pending",
    } as unknown as Listing);

    const result = await getMarketplaceListingBySlug("test-listing");
    expect(result).toBeNull();
  });

  it("should get marketplace seller", async () => {
    const { getStoredProfileById } = await import("@/services/profile/profile-records");
    vi.mocked(getStoredProfileById).mockResolvedValue(mockProfile as unknown as Profile);

    const result = await getMarketplaceSeller("seller-1");
    expect(result).toBeDefined();
  });

  it("should get public marketplace listings", async () => {
    const { getPublicListings } = await import("@/services/listings/catalog");
    vi.mocked(getPublicListings).mockResolvedValue({
      listings: [],
      total: 0,
      page: 1,
      limit: 12,
      hasMore: false,
    });

    const result = await getPublicMarketplaceListings();
    expect(result).toBeDefined();
  });

  it("should get all known listings", async () => {
    const { getPublicListings } = await import("@/services/listings/catalog");
    vi.mocked(getPublicListings).mockResolvedValue({
      listings: [mockListing as Listing],
      total: 1,
      page: 1,
      limit: 100,
      hasMore: false,
    });

    const result = await getAllKnownListings();
    expect(result).toHaveLength(1);
  });

  it("should get similar marketplace listings", async () => {
    const { getPublicListings } = await import("@/services/listings/catalog");
    vi.mocked(getPublicListings)
      .mockResolvedValueOnce({
        listings: [mockListing as Listing],
        total: 1,
        page: 1,
        limit: 10,
        hasMore: false,
      })
      .mockResolvedValueOnce({
        listings: [mockListing as Listing],
        total: 1,
        page: 1,
        limit: 10,
        hasMore: false,
      });

    const result = await getSimilarMarketplaceListings("current-slug", "BMW", "Istanbul");
    expect(result).toHaveLength(1);
  });
});
