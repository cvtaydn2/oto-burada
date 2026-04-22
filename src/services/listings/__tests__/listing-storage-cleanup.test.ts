/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Listing } from "@/types";

import { updateDatabaseListing } from "../listing-submission-persistence";

const queueFileCleanup = vi.fn().mockResolvedValue(undefined);

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

vi.mock("@/lib/storage/registry", () => ({
  queueFileCleanup,
}));

describe("Listing Storage Cleanup", () => {
  const admin = createSupabaseAdminClient() as unknown as Record<string, any>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should identify and delete orphaned storage images during update", async () => {
    // 1. Mock the identified orphans check (listing_images table)
    (admin.from() as any).then.mockImplementationOnce((resolve: (val: any) => void) => {
      resolve({
        data: [{ storage_path: "old-1.jpg" }, { storage_path: "keep.jpg" }],
        error: null,
      });
    });

    // New listing state (only keep.jpg remains)
    const listing = {
      id: "listing-1",
      images: [{ storagePath: "keep.jpg", url: "...", order: 0, isCover: true }],
    } as unknown as Listing;

    await updateDatabaseListing(listing);

    expect(queueFileCleanup).toHaveBeenCalledWith("listing-images", ["old-1.jpg"]);
  });

  it("should not delete images that are still present", async () => {
    (admin.from() as any).then.mockImplementationOnce((resolve: (val: any) => void) => {
      resolve({
        data: [{ storage_path: "keep.jpg" }],
        error: null,
      });
    });

    const listing = {
      id: "listing-1",
      images: [{ storagePath: "keep.jpg", url: "...", order: 0, isCover: true }],
    } as unknown as Listing;

    await updateDatabaseListing(listing);

    expect(queueFileCleanup).not.toHaveBeenCalled();
  });
});
