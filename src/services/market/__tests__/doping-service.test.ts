import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DopingResult } from "../doping-service";

// Mock all external dependencies
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { seller_id: "user-123" },
            error: null,
          }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: "payment-1" },
            error: null,
          }),
        })),
      })),
      rpc: vi.fn().mockResolvedValue({
        data: { applied_count: 1 },
        error: null,
      }),
    })),
    rpc: vi.fn().mockResolvedValue({
      data: { applied_count: 1 },
      error: null,
    }),
  })),
}));

vi.mock("@/lib/supabase/env", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
}));

vi.mock("@/lib/payment", () => ({
  payment: {
    processPayment: vi.fn().mockResolvedValue({
      success: true,
      status: "success",
      transactionId: "mock-tx-123",
    }),
  },
}));

vi.mock("@/lib/payment/config", () => ({
  isPaymentEnabled: vi.fn(() => true),
}));

describe("Doping Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should apply featured doping successfully", async () => {
    const { applyDopingToListing } = await import("../doping-service");
    const result: DopingResult = await applyDopingToListing("listing-1", "user-123", ["featured"]);
    expect(result.success).toBe(true);
    expect(result.message).toContain("başarıyla");
  });

  it("should fail when payment fails", async () => {
    const { payment } = await import("@/lib/payment");
    vi.mocked(payment.processPayment).mockResolvedValueOnce({
      success: false,
      status: "failure",
      error: "Ödeme reddedildi",
    });

    const { applyDopingToListing } = await import("../doping-service");
    const result = await applyDopingToListing("listing-1", "user-123", ["urgent"]);
    expect(result.success).toBe(false);
    expect(result.message).toContain("Ödeme");
  });

  it("should apply multiple doping types", async () => {
    const { applyDopingToListing } = await import("../doping-service");
    const result = await applyDopingToListing("listing-1", "user-123", [
      "featured",
      "urgent",
      "highlighted",
    ]);
    expect(result.success).toBe(true);
  });

  it("should return error when supabase env is missing", async () => {
    const { hasSupabaseAdminEnv } = await import("@/lib/supabase/env");
    vi.mocked(hasSupabaseAdminEnv).mockReturnValueOnce(false);

    const { applyDopingToListing } = await import("../doping-service");
    const result = await applyDopingToListing("listing-1", "user-123", ["featured"]);
    expect(result.success).toBe(false);
  });
});
