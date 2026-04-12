import { expect, it, describe, vi, beforeEach } from "vitest";
import { recordListingView, getListingViewCount } from "../listing-views";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Mock dependencies
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({
  hasSupabaseAdminEnv: () => true,
}));

describe("Listing Views Service", () => {
  let mockAdmin: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAdmin = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled) => onFulfilled({ data: null, error: null, count: null })),
    };

    (createSupabaseAdminClient as any).mockReturnValue(mockAdmin);
  });

  it("should record view for authenticated user and update listing count", async () => {
    mockAdmin.then.mockImplementationOnce((onFulfilled: any) => onFulfilled({ error: null })) // upsert
                 .mockImplementationOnce((onFulfilled: any) => onFulfilled({ count: 42, error: null })) // count
                 .mockImplementationOnce((onFulfilled: any) => onFulfilled({ error: null })); // update

    await recordListingView("listing-123", { viewerId: "user-456" });

    expect(mockAdmin.from).toHaveBeenCalledWith("listing_views");
    expect(mockAdmin.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        listing_id: "listing-123",
        viewer_id: "user-456",
      }),
      expect.any(Object)
    );

    // Verify denormalized count update
    expect(mockAdmin.update).toHaveBeenCalledWith({ view_count: 42 });
  });

  it("should record anonymous view if not seen within 24 hours", async () => {
    // Mock: No existing view found
    mockAdmin.then.mockImplementationOnce((onFulfilled: any) => onFulfilled({ data: [], error: null })) // existing check
                 .mockImplementationOnce((onFulfilled: any) => onFulfilled({ error: null })) // insert
                 .mockImplementationOnce((onFulfilled: any) => onFulfilled({ count: 10, error: null })) // count
                 .mockImplementationOnce((onFulfilled: any) => onFulfilled({ error: null })); // update

    await recordListingView("listing-123", { viewerIp: "127.0.0.1" });

    expect(mockAdmin.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        listing_id: "listing-123",
        viewer_ip: "127.0.0.1",
        viewer_id: null,
      })
    );
  });

  it("should skip anonymous view if seen within 24 hours", async () => {
    // Mock: Existing view found
    mockAdmin.then.mockImplementationOnce((onFulfilled: any) => onFulfilled({ data: [{ id: "view-1" }], error: null }));

    await recordListingView("listing-123", { viewerIp: "127.0.0.1" });

    // Should NOT insert
    expect(mockAdmin.insert).not.toHaveBeenCalled();
    // Should NOT update listing count
    expect(mockAdmin.update).not.toHaveBeenCalled();
  });

  it("should return correct view count", async () => {
    mockAdmin.then.mockImplementationOnce((onFulfilled: any) => onFulfilled({ count: 99, error: null }));

    const count = await getListingViewCount("listing-123");

    expect(count).toBe(99);
    expect(mockAdmin.eq).toHaveBeenCalledWith("listing_id", "listing-123");
  });
});
