import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Listing, Profile } from "@/types";

import {
  getFilteredMarketplaceListings,
  getMarketplaceListingBySlug,
  getMarketplaceListingsByIds,
  getMarketplaceSeller,
  getPublicMarketplaceListings,
  getRecentMarketplaceListings,
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

vi.mock("@/services/listings/listing-submission-query", () => ({
  getSimilarDatabaseListings: vi.fn(),
  marketplaceListingSelect: "*",
}));

vi.mock("@/services/listings/catalog", () => ({
  getPublicListings: vi.fn(),
  getListingBySlug: vi.fn(),
}));

vi.mock("@/services/profile/profile-records", () => ({
  getPublicSellerProfile: vi.fn(),
}));

vi.mock("@/lib/supabase/public-server", () => ({
  createSupabasePublicServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
    })),
  })),
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
    const { getListingBySlug } = await import("@/services/listings/catalog");
    vi.mocked(getListingBySlug).mockResolvedValue(mockListing as unknown as Listing);

    const result = await getMarketplaceListingBySlug("test-listing");
    expect(result).toBeDefined();
  });

  it("should return null for non-approved listing", async () => {
    const { getListingBySlug } = await import("@/services/listings/catalog");
    vi.mocked(getListingBySlug).mockResolvedValue({
      ...mockListing,
      status: "pending",
    } as unknown as Listing);

    const result = await getMarketplaceListingBySlug("test-listing");
    expect(result).toBeNull();
  });

  it("should get marketplace seller", async () => {
    const { getPublicSellerProfile } = await import("@/services/profile/profile-records");
    vi.mocked(getPublicSellerProfile).mockResolvedValue(mockProfile as unknown as Profile);

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

  it("should get recent marketplace listings", async () => {
    const { getPublicListings } = await import("@/services/listings/catalog");
    vi.mocked(getPublicListings).mockResolvedValue({
      listings: [mockListing as Listing],
      total: 1,
      page: 1,
      limit: 100,
      hasMore: false,
    });

    const result = await getRecentMarketplaceListings();
    expect(result).toHaveLength(1);
  });

  it("should get similar marketplace listings", async () => {
    const { getSimilarDatabaseListings } =
      await import("@/services/listings/listing-submission-query");
    vi.mocked(getSimilarDatabaseListings).mockResolvedValue([mockListing as Listing]);

    const result = await getSimilarMarketplaceListings("current-slug", "BMW", "Istanbul");
    expect(result).toHaveLength(1);
  });
});
