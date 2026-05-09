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

vi.mock("../listing-submissions", () => ({
  getStoredListingById: vi.fn(),
  getStoredListingBySlug: vi.fn(),
  getStoredListingsByIds: vi.fn(),
}));

vi.mock("../listing-submission-query", () => ({
  getSimilarDatabaseListings: vi.fn(),
  marketplaceListingSelect: "*",
  listingCardSelect: "*",
}));

vi.mock("../catalog", () => ({
  getPublicListings: vi.fn(),
  getListingBySlug: vi.fn(),
}));

vi.mock("../../../../profile/services/profile/profile-records", () => ({
  getPublicSellerProfile: vi.fn(),
}));

vi.mock("../../../../../lib/supabase/public-server", () => ({
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

vi.mock("../../../../../lib/logger", () => ({
  logger: {
    listings: {
      warn: vi.fn(),
    },
    db: {
      error: vi.fn(),
    },
  },
}));

vi.mock("../../../../../lib/telemetry-server", () => ({
  captureServerEvent: vi.fn(),
}));

describe("Marketplace Listings Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get filtered marketplace listings", async () => {
    const { getPublicListings } = await import("../catalog");
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

  it("should preserve supported marketplace filters, strip unsafe query content and surface dropped filter metadata", async () => {
    const { getPublicListings } = await import("../catalog");

    vi.mocked(getPublicListings).mockResolvedValue({
      listings: [],
      total: 0,
      page: 3,
      limit: 24,
      hasMore: false,
      metadata: {
        source: "test",
      },
    });

    const filters = {
      page: 3,
      limit: 24,
      city: "İstanbul",
      query: "BMW <script>alert('x')</script>",
      unsupportedFlag: true,
    } as const;

    const result = await getFilteredMarketplaceListings(filters);

    expect(getPublicListings).toHaveBeenCalledWith({
      page: 3,
      limit: 24,
      city: "İstanbul",
      query: "BMW alert('x')",
    });
    expect(result.metadata).toEqual({
      source: "test",
      droppedFilters: ["unsupportedFlag"],
      warning: "Bazı filtreler desteklenmiyor ve uygulanmadı.",
    });
  });

  it("should get marketplace listings by IDs", async () => {
    const { getStoredListingsByIds } = await import("../listing-submissions");
    vi.mocked(getStoredListingsByIds).mockResolvedValue([]);

    const result = await getMarketplaceListingsByIds(["id1", "id2"]);
    expect(result).toEqual([]);
  });

  it("should get marketplace listing by slug", async () => {
    const { getListingBySlug } = await import("../catalog");
    vi.mocked(getListingBySlug).mockResolvedValue(mockListing as unknown as Listing);

    const result = await getMarketplaceListingBySlug("test-listing");
    expect(result).toBeDefined();
  });

  it("should return null for non-approved listing", async () => {
    const { getListingBySlug } = await import("../catalog");
    vi.mocked(getListingBySlug).mockResolvedValue({
      ...mockListing,
      status: "pending",
    } as unknown as Listing);

    const result = await getMarketplaceListingBySlug("test-listing");
    expect(result).toBeNull();
  });

  it("should get marketplace seller", async () => {
    const { getPublicSellerProfile } =
      await import("../../../../profile/services/profile/profile-records");
    vi.mocked(getPublicSellerProfile).mockResolvedValue(mockProfile as unknown as Profile);

    const result = await getMarketplaceSeller("seller-1");
    expect(result).toBeDefined();
  });

  it("should get public marketplace listings", async () => {
    const { getPublicListings } = await import("../catalog");
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
    const { getPublicListings } = await import("../catalog");
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
    const { getSimilarDatabaseListings } = await import("../listing-submission-query");
    vi.mocked(getSimilarDatabaseListings).mockResolvedValue([mockListing as Listing]);

    const result = await getSimilarMarketplaceListings("current-slug", "BMW", "Istanbul");
    expect(result).toHaveLength(1);
  });
});
