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
  createSupabaseAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            neq: vi.fn(() => ({
              maybeSingle,
            })),
          })),
        })),
      })),
    })),
  })),
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
