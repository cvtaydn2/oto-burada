/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateDatabaseListing } from "../listing-submission-persistence";

const queueFileCleanup = vi.fn().mockResolvedValue(undefined);
const fromMock = vi.fn();

vi.mock("@/lib/supabase/env", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from: fromMock,
  })),
}));

vi.mock("@/lib/sanitization/sanitize", () => ({
  sanitizeDescription: (s: string) => s,
}));

vi.mock("@/lib/storage/registry", () => ({
  queueFileCleanup,
}));

function createListingsChain() {
  return {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: {
          id: "listing-1",
          seller_id: "seller-1",
          slug: "test-listing",
          title: "Test",
          category: "otomobil",
          brand: "BMW",
          model: "320i",
          year: 2020,
          mileage: 10000,
          fuel_type: "benzin",
          transmission: "otomatik",
          price: 1000000,
          city: "İstanbul",
          district: "Kadıköy",
          description: "desc",
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
      }),
    }),
  };
}

describe("Listing Storage Cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should identify and queue orphaned storage images during update", async () => {
    const oldImages = [
      { storage_path: "old-1.jpg", is_cover: false, sort_order: 0, public_url: "x" },
      { storage_path: "keep.jpg", is_cover: true, sort_order: 1, public_url: "y" },
    ];

    fromMock.mockImplementation((table: string) => {
      if (table === "listings") return createListingsChain();
      if (table === "listing_images") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: oldImages, error: null }),
          }),
          delete: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ error: null }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {};
    });

    const listing = {
      id: "listing-1",
      sellerId: "seller-1",
      slug: "test-listing",
      title: "Test",
      category: "otomobil",
      brand: "BMW",
      model: "320i",
      year: 2020,
      mileage: 10000,
      fuelType: "benzin",
      transmission: "otomatik",
      price: 1000000,
      city: "İstanbul",
      district: "Kadıköy",
      description: "desc",
      whatsappPhone: "905551234567",
      status: "pending",
      featured: false,
      version: 1,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
      images: [{ storagePath: "keep.jpg", url: "y", order: 0, isCover: true }],
      viewCount: 0,
    } as any;

    await updateDatabaseListing(listing);
    expect(queueFileCleanup).toHaveBeenCalledWith("listing-images", ["old-1.jpg"]);
  });

  it("should not queue cleanup when all images are still present", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "listings") return createListingsChain();
      if (table === "listing_images") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ storage_path: "keep.jpg", is_cover: true, sort_order: 0, public_url: "y" }],
              error: null,
            }),
          }),
          delete: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ error: null }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {};
    });

    const listing = {
      id: "listing-1",
      sellerId: "seller-1",
      slug: "test-listing",
      title: "Test",
      category: "otomobil",
      brand: "BMW",
      model: "320i",
      year: 2020,
      mileage: 10000,
      fuelType: "benzin",
      transmission: "otomatik",
      price: 1000000,
      city: "İstanbul",
      district: "Kadıköy",
      description: "desc",
      whatsappPhone: "905551234567",
      status: "pending",
      featured: false,
      version: 1,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
      images: [{ storagePath: "keep.jpg", url: "y", order: 0, isCover: true }],
      viewCount: 0,
    } as any;

    await updateDatabaseListing(listing);
    expect(queueFileCleanup).not.toHaveBeenCalled();
  });
});
