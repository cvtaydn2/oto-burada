import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DopingResult } from "../doping-service";

// Mock all external dependencies
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => {
    // Build a fully chainable mock that supports any number of .eq() calls
    const chain: Record<string, unknown> = {};
    const chainMethods = [
      "select",
      "eq",
      "order",
      "limit",
      "single",
      "maybeSingle",
      "insert",
      "update",
      "upsert",
      "delete",
    ];
    for (const method of chainMethods) {
      chain[method] = vi.fn(() => chain);
    }
    // Terminal resolvers
    (chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { id: "payment-1", seller_id: "user-123", status: "active" },
      error: null,
    });
    (chain.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: null,
    });
    (chain.insert as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: { id: "payment-1" }, error: null }),
      })),
    });
    (chain.update as ReturnType<typeof vi.fn>).mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    return {
      from: vi.fn(() => chain),
      rpc: vi.fn().mockResolvedValue({ data: { applied_count: 1 }, error: null }),
    };
  }),
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
