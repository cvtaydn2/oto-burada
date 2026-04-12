import { expect, it, describe, vi, beforeEach } from "vitest";
import { applyDopingToListing } from "../doping-service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { payment } from "@/lib/payment";

// Mock dependencies
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({
  hasSupabaseAdminEnv: () => true,
}));

vi.mock("@/lib/payment", () => ({
  payment: {
    processPayment: vi.fn(),
  },
}));

describe("Doping Service", () => {
  let mockAdmin: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAdmin = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled) => onFulfilled({ data: null, error: null })),
    };

    (createSupabaseAdminClient as any).mockReturnValue(mockAdmin);
  });

  it("should fail if user is not the owner", async () => {
    mockAdmin.then.mockImplementationOnce((onFulfilled: any) => onFulfilled({ data: { seller_id: "other-user" }, error: null }));

    const result = await applyDopingToListing("listing-1", "my-user", ["featured"]);

    expect(result.success).toBe(false);
    expect(result.message).toContain("İlan sahibi");
    expect(mockAdmin.update).not.toHaveBeenCalled();
  });

  it("should apply multiple dopings correctly on successful payment", async () => {
    mockAdmin.then.mockImplementationOnce((onFulfilled: any) => onFulfilled({ data: { seller_id: "my-user" }, error: null })) // single
                 .mockImplementationOnce((onFulfilled: any) => onFulfilled({ error: null })) // update
                 .mockImplementationOnce((onFulfilled: any) => onFulfilled({ error: null })); // insert
    
    (payment.processPayment as any).mockResolvedValue({
      success: true,
      transactionId: "trx-123",
      status: "completed"
    });

    const result = await applyDopingToListing("listing-1", "my-user", ["featured", "urgent"]);

    expect(result.success).toBe(true);
    
    // Check update payload
    expect(mockAdmin.update).toHaveBeenCalledWith(expect.objectContaining({
      featured: true,
      featured_until: expect.any(String),
      urgent_until: expect.any(String)
    }));

    // Check payment log
    expect(mockAdmin.insert).toHaveBeenCalledWith(expect.objectContaining({
      amount: 100, // 2 dopings * 50
      status: "completed"
    }));
  });

  it("should fail if payment fails", async () => {
    mockAdmin.then.mockImplementationOnce((onFulfilled: any) => onFulfilled({ data: { seller_id: "my-user" }, error: null }));
    (payment.processPayment as any).mockResolvedValue({
      success: false,
      error: "Bakiye yetersiz"
    });

    const result = await applyDopingToListing("listing-1", "my-user", ["highlighted"]);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Bakiye yetersiz");
    expect(mockAdmin.update).not.toHaveBeenCalled();
  });
});
