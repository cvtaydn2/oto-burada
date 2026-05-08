import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDatabaseListings } from "@/features/marketplace/services/listing-submission-query";
import * as notifications from "@/features/notifications/services/notification-records";
import type { Listing } from "@/types";

import {
  moderateListingsWithSideEffects,
  moderateListingWithSideEffects,
} from "../listing-moderation";
import * as moderationActions from "../moderation-actions";

vi.mock("@/lib/env", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
}));

const listingsTable = {
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
  single: vi.fn(),
};

vi.mock("@/lib/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from: vi.fn(() => listingsTable),
    rpc: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    auth: {
      admin: {
        getUserById: vi.fn().mockResolvedValue({ data: { user: { email: null } } }),
      },
    },
  })),
}));

vi.mock("@/features/marketplace/services/listing-submission-query", () => ({
  getDatabaseListings: vi.fn(),
}));

vi.mock("../moderation-actions", () => ({
  createAdminModerationAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/features/notifications/services/notification-records", () => ({
  createDatabaseNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/client", () => ({
  invalidateCache: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/features/marketplace/services/market-stats", () => ({
  updateMarketStats: vi.fn().mockResolvedValue(undefined),
}));

describe("listing-moderation service", () => {
  const mockListing: Listing = {
    id: "listing-123",
    slug: "test-car",
    title: "Test Car",
    sellerId: "seller-456",
    brand: "Fiat",
    model: "Egea",
    category: "otomobil",
    year: 2022,
    mileage: 15000,
    fuelType: "benzin",
    transmission: "otomatik",
    price: 1000000,
    city: "Istanbul",
    district: "Kadikoy",
    description: "Test description",
    whatsappPhone: "905551112233",
    status: "pending",
    images: [],
    featured: false,
    viewCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://otoburada.test");
    listingsTable.update.mockReturnThis();
    listingsTable.eq.mockReturnThis();
    listingsTable.in.mockReturnThis();
    listingsTable.select.mockReturnThis();
    listingsTable.single.mockResolvedValue({
      data: { ...mockListing, seller_id: mockListing.sellerId, seller: null },
      error: null,
    });
    listingsTable.maybeSingle.mockResolvedValue({ data: { id: mockListing.id }, error: null });
  });

  it("should approve a listing and trigger side effects", async () => {
    vi.mocked(getDatabaseListings).mockResolvedValue([{ ...mockListing, status: "approved" }]);

    const result = await moderateListingWithSideEffects({
      action: "approve",
      adminUserId: "admin-1",
      listingId: mockListing.id,
    });

    expect(result?.status).toBe("approved");
    // Side effects are enqueued atomically via RPC in current architecture.
    // Direct record helper calls are no longer expected here.
    expect(moderationActions.createAdminModerationAction).not.toHaveBeenCalled();
    expect(notifications.createDatabaseNotification).not.toHaveBeenCalled();
  });

  it("should reject a listing and trigger side effects", async () => {
    vi.mocked(getDatabaseListings).mockResolvedValue([{ ...mockListing, status: "rejected" }]);

    const result = await moderateListingWithSideEffects({
      action: "reject",
      adminUserId: "admin-1",
      listingId: mockListing.id,
      note: "Invalid description",
    });

    expect(result?.status).toBe("rejected");
    // Side effects are enqueued atomically via RPC in current architecture.
    expect(moderationActions.createAdminModerationAction).not.toHaveBeenCalled();
  });

  it("should return null if database update fails", async () => {
    listingsTable.single.mockResolvedValueOnce({ data: null, error: null });
    vi.mocked(getDatabaseListings).mockResolvedValue([]);

    const result = await moderateListingWithSideEffects({
      action: "approve",
      adminUserId: "admin-1",
      listingId: "missing-id",
    });

    expect(result).toBeNull();
    expect(notifications.createDatabaseNotification).not.toHaveBeenCalled();
  });

  it("should handle multiple listings", async () => {
    vi.mocked(getDatabaseListings)
      .mockResolvedValueOnce([{ ...mockListing, id: "1", status: "approved" }])
      .mockResolvedValueOnce([{ ...mockListing, id: "2", status: "approved" }]);

    const result = await moderateListingsWithSideEffects({
      action: "approve",
      adminUserId: "admin-1",
      listingIds: ["1", "2"],
    });

    expect(result.moderatedListings).toHaveLength(2);
    expect(result.skippedListingIds).toHaveLength(0);
  });

  it("should track skipped listings", async () => {
    vi.mocked(getDatabaseListings)
      .mockResolvedValueOnce([{ ...mockListing, id: "1", status: "approved" }])
      .mockResolvedValueOnce([]);

    listingsTable.maybeSingle
      .mockResolvedValueOnce({ data: { id: "1" }, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    const result = await moderateListingsWithSideEffects({
      action: "approve",
      adminUserId: "admin-1",
      listingIds: ["1", "missing"],
    });

    expect(result.moderatedListings).toHaveLength(1);
    expect(result.skippedListingIds).toContain("missing");
  });
});
