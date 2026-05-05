/**
 * Bug 4: Non-transactional image persistence during listing update
 * Bug 6: Orphan file risk on createDatabaseListing image insert failure
 *
 * Tests that:
 * - updateDatabaseListing restores old images when new image insert fails
 * - createDatabaseListing queues storage cleanup when image insert fails
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockQueueFileCleanup = vi.fn();

vi.mock("@/lib/supabase/env", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
}));

vi.mock("@/lib/sanitization/sanitize", () => ({
  sanitizeDescription: (s: string) => s,
}));

vi.mock("@/lib/storage/registry", () => ({
  queueFileCleanup: (...args: any[]) => mockQueueFileCleanup(...args),
}));

const mockFrom = vi.fn();
const mockRpc = vi.fn();
const mockAdminClient = { from: mockFrom, rpc: mockRpc };

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() => Promise.resolve(mockAdminClient)),
}));

// Minimal listing fixture
function makeListing(overrides: Record<string, any> = {}) {
  return {
    id: "listing-1",
    sellerId: "seller-1",
    slug: "bmw-320i-2020",
    title: "BMW 320i",
    brand: "BMW",
    model: "320i",
    year: 2020,
    mileage: 50000,
    fuelType: "benzin",
    transmission: "otomatik",
    price: 1500000,
    city: "İstanbul",
    district: "Beşiktaş",
    description: "Clean car",
    whatsappPhone: "905551234567",
    licensePlate: null,
    vin: null,
    carTrim: null,
    tramerAmount: null,
    damageStatusJson: null,
    fraudScore: 0,
    fraudReason: null,
    status: "pending",
    featured: false,
    featuredUntil: null,
    urgentUntil: null,
    highlightedUntil: null,
    marketPriceIndex: null,
    expertInspection: undefined,
    bumpedAt: null,
    viewCount: 0,
    version: 1,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
    images: [
      {
        id: "img-1",
        listingId: "listing-1",
        storagePath: "listings/seller-1/new.jpg",
        url: "https://example.com/new.jpg",
        order: 0,
        isCover: true,
      },
    ],
    ...overrides,
  };
}

describe("updateDatabaseListing — image persistence failure handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns image_persistence_error when image upsert fails", async () => {
    const oldImageRows = [
      {
        storage_path: "listings/seller-1/old.jpg",
        is_cover: true,
        sort_order: 0,
        public_url: "https://example.com/old.jpg",
        placeholder_blur: null,
      },
    ];

    mockRpc.mockResolvedValue({ data: null, error: { message: "upsert failed" } });
    mockFrom.mockImplementation((table: string) => {
      if (table === "listing_images") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: oldImageRows, error: null }),
          }),
        };
      }

      return {};
    });

    const { updateDatabaseListing } = await import("../listing-submission-persistence");
    const result = await updateDatabaseListing(makeListing() as any);

    expect(result.error).toBe("image_persistence_error");

    expect(mockRpc).toHaveBeenCalledWith("upsert_listing_with_images", {
      p_listing_data: expect.objectContaining({
        id: "listing-1",
        brand: "BMW",
      }),
      p_images_to_delete: ["listings/seller-1/old.jpg"],
      p_images_to_upsert: [
        expect.objectContaining({
          storage_path: "listings/seller-1/new.jpg",
          public_url: "https://example.com/new.jpg",
        }),
      ],
    });
  });
});

describe("createDatabaseListing — orphan cleanup on image insert failure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueueFileCleanup.mockResolvedValue(undefined);
  });

  it("queues storage cleanup when image insert fails after listing insert", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "image insert failed" } });
    mockFrom.mockImplementation((table: string) => {
      if (table === "listings") {
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }

      return {};
    });

    const listing = makeListing({
      images: [
        {
          id: "img-1",
          listingId: "listing-1",
          storagePath: "listings/seller-1/photo.jpg",
          url: "https://example.com/photo.jpg",
          order: 0,
          isCover: true,
        },
      ],
    });

    const { createDatabaseListing } = await import("../listing-submission-persistence");
    const result = await createDatabaseListing(listing as any);

    expect(result.error).toBe("image_persistence_error");

    // Storage cleanup must be queued for the orphaned file
    expect(mockQueueFileCleanup).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(["listings/seller-1/photo.jpg"])
    );
  });
});
