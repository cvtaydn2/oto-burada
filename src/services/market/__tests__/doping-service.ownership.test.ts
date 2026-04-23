import { beforeEach, describe, expect, it, vi } from "vitest";

const maybeSingle = vi.fn();
const processPayment = vi.fn();

vi.mock("@/lib/supabase/env", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
}));

vi.mock("@/lib/payment/config", () => ({
  isPaymentEnabled: vi.fn(() => true),
}));

vi.mock("@/lib/payment", () => ({
  payment: {
    processPayment,
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => {
    // Fully chainable mock — supports any depth of .eq() calls
    const chain: Record<string, unknown> = {};
    const chainMethods = ["select", "eq", "order", "limit", "not", "neq"];
    for (const method of chainMethods) {
      chain[method] = vi.fn(() => chain);
    }
    // Terminal resolvers — listing lookup uses .single(), payment lookup uses .maybeSingle()
    chain.single = vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } });
    chain.maybeSingle = maybeSingle;
    return {
      from: vi.fn(() => chain),
    };
  }),
}));

describe("doping service ownership hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails closed before payment when listing ownership validation fails", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });

    const { applyDopingToListing } = await import("../doping-service");
    const result = await applyDopingToListing("listing-1", "user-123", ["featured"]);

    expect(result).toEqual({
      success: false,
      message: "Doping uygulanabilir ilan bulunamadı.",
    });
    expect(processPayment).not.toHaveBeenCalled();
  });
});
