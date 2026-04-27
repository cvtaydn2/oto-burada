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
const mockAdminClient = { from: mockFrom };

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => mockAdminClient),
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

    const upsertMock = vi.fn();

    mockFrom.mockImplementation((table: string) => {
      if (table === "listings") {
        const singleMock = vi.fn().mockResolvedValue({
          data: {
            id: "listing-1",
            seller_id: "seller-1",
            slug: "bmw-320i-2020",
            title: "BMW 320i",
            brand: "BMW",
            model: "320i",
            year: 2020,
            mileage: 50000,
            fuel_type: "benzin",
            transmission: "otomatik",
            price: 1500000,
            city: "İstanbul",
            district: "Beşiktaş",
            description: "Clean car",
            whatsapp_phone: "905551234567",
            vin: null,
            license_plate: null,
            car_trim: null,
            tramer_amount: null,
            damage_status_json: null,
            fraud_score: 0,
            fraud_reason: null,
            status: "pending",
            featured: false,
            featured_until: null,
            urgent_until: null,
            highlighted_until: null,
            market_price_index: null,
            expert_inspection: null,
            published_at: null,
            bumped_at: null,
            view_count: 0,
            version: 2,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-02T00:00:00Z",
          },
          error: null,
        });
        const chainable: any = {
          update: vi.fn().mockReturnThis(),
          match: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnValue({ single: singleMock }),
          single: singleMock,
        };
        return chainable;
      }

      if (table === "listing_images") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: oldImageRows, error: null }),
          }),
          delete: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ error: null }),
          }),
          upsert: upsertMock,
        };
      }

      return {};
    });

    upsertMock.mockResolvedValueOnce({ error: { message: "upsert failed" } });

    const { updateDatabaseListing } = await import("../listing-submission-persistence");
    const result = await updateDatabaseListing(makeListing() as any);

    expect(result.error).toBe("image_persistence_error");

    expect(upsertMock).toHaveBeenCalledTimes(1);
    const upsertCall = upsertMock.mock.calls[0][0];
    expect(upsertCall[0]).toMatchObject({
      listing_id: "listing-1",
      storage_path: "listings/seller-1/new.jpg",
    });
  });
});

describe("createDatabaseListing — orphan cleanup on image insert failure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueueFileCleanup.mockResolvedValue(undefined);
  });

  it("queues storage cleanup when image insert fails after listing insert", async () => {
    const insertedListingData = {
      id: "listing-1",
      seller_id: "seller-1",
      slug: "bmw-320i-2020-abc123",
      title: "BMW 320i",
      brand: "BMW",
      model: "320i",
      year: 2020,
      mileage: 50000,
      fuel_type: "benzin",
      transmission: "otomatik",
      price: 1500000,
      city: "İstanbul",
      district: "Beşiktaş",
      description: "Clean car",
      whatsapp_phone: "905551234567",
      vin: null,
      license_plate: null,
      car_trim: null,
      tramer_amount: null,
      damage_status_json: null,
      fraud_score: 0,
      fraud_reason: null,
      status: "pending",
      featured: false,
      featured_until: null,
      urgent_until: null,
      highlighted_until: null,
      market_price_index: null,
      expert_inspection: null,
      published_at: null,
      bumped_at: null,
      view_count: 0,
      version: 1,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "listings") {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: insertedListingData, error: null }),
            }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }

      if (table === "listing_images") {
        return {
          insert: vi.fn().mockResolvedValue({ error: { message: "image insert failed" } }),
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
