import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateDatabaseListing } from "../listing-submission-persistence";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/admin", () => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve({ data: { id: "1" }, error: null })),
    then: vi.fn().mockImplementation((resolve) => {
      // Default empty result for await
      resolve({ data: [], error: null });
    }),
  };

  const mockFrom = vi.fn().mockReturnValue(chain);

  const mockStorage = {
    from: vi.fn().mockReturnThis(),
    remove: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return {
    createSupabaseAdminClient: vi.fn(() => ({
      from: mockFrom,
      storage: mockStorage,
    })),
  };
});

vi.mock("@/lib/supabase/env", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
}));

describe("Listing Storage Cleanup", () => {
  const admin = createSupabaseAdminClient() as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should identify and delete orphaned storage images during update", async () => {
    // 1. Mock the identified orphans check (listing_images table)
    admin.from().then.mockImplementationOnce((resolve: any) => {
      resolve({ 
        data: [{ storage_path: "old-1.jpg" }, { storage_path: "keep.jpg" }], 
        error: null 
      });
    });

    // New listing state (only keep.jpg remains)
    const listing = {
      id: "listing-1",
      images: [{ storagePath: "keep.jpg", url: "...", order: 0, isCover: true }],
    } as any;

    await updateDatabaseListing(listing);

    // Verify storage cleanup called for old-1.jpg
    expect(admin.storage.from).toHaveBeenCalledWith("listing-images");
    expect(admin.storage.remove).toHaveBeenCalledWith(["old-1.jpg"]);
  });

  it("should not delete images that are still present", async () => {
    admin.from().then.mockImplementationOnce((resolve: any) => {
      resolve({ 
        data: [{ storage_path: "keep.jpg" }], 
        error: null 
      });
    });

    const listing = {
      id: "listing-1",
      images: [{ storagePath: "keep.jpg", url: "...", order: 0, isCover: true }],
    } as any;

    await updateDatabaseListing(listing);

    expect(admin.storage.remove).not.toHaveBeenCalled();
  });
});
