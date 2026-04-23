import { beforeEach, describe, expect, it, vi } from "vitest";

import { applyDopingToListing } from "@/services/market/doping-service";

// Mock dependencies
vi.mock("@/lib/payment", () => ({
  payment: {
    processPayment: vi.fn(),
  },
}));

const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain: any = {};
    chain.from = vi.fn(() => chain);
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.order = vi.fn(() => chain);
    chain.limit = vi.fn(() => chain);
    chain.update = vi.fn(() => chain);
    chain.insert = vi.fn(() => chain);
    chain.single = mockSingle;
    chain.maybeSingle = mockMaybeSingle;
    return chain;
  }),
}));

vi.mock("@/lib/supabase/env", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
}));

vi.mock("@/lib/payment/config", () => ({
  isPaymentEnabled: vi.fn(() => true),
}));

describe("applyDopingToListing — idempotency / duplicate payment", () => {
  const USER_ID = "user-123";
  const DOPING_TYPES = ["highlighted" as const];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockReset();
    mockMaybeSingle.mockReset();
  });

  it("returns fail-closed when payment is already fulfilled (status=success)", async () => {
    const LISTING_ID = "listing-1";
    mockSingle.mockResolvedValueOnce({
      data: { id: LISTING_ID, seller_id: USER_ID, status: "active" },
      error: null,
    });
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        id: "pay-1",
        iyzico_token: "tok-existing",
        status: "success",
        fulfilled_at: new Date().toISOString(),
      },
      error: null,
    });

    const result = await applyDopingToListing(LISTING_ID, USER_ID, [...DOPING_TYPES]);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/zaten tamamlanmış/i);
  });

  it("returns fail-closed when there is a pending payment with token", async () => {
    const LISTING_ID = "listing-2";
    mockSingle.mockResolvedValueOnce({
      data: { id: LISTING_ID, seller_id: USER_ID, status: "active" },
      error: null,
    });
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        id: "pay-2",
        iyzico_token: "tok-pending",
        status: "pending",
        fulfilled_at: null,
      },
      error: null,
    });

    const result = await applyDopingToListing(LISTING_ID, USER_ID, [...DOPING_TYPES]);
    expect(result.success).toBe(true);
    expect(result.message).toMatch(/mevcut ödeme.*devam ediyor/i);
  });

  it("handles DB unique constraint violation (23505) on insert", async () => {
    const LISTING_ID = "listing-3";
    mockSingle.mockResolvedValueOnce({
      data: { id: LISTING_ID, seller_id: USER_ID, status: "active" },
      error: null,
    });
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    // Insert fails
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: "23505", message: "duplicate" },
    });

    const result = await applyDopingToListing(LISTING_ID, USER_ID, [...DOPING_TYPES]);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Ödeme kaydı oluşturulamadı/i);
  });

  it("returns error when existing payment check itself fails", async () => {
    const LISTING_ID = "listing-4";
    mockSingle.mockResolvedValueOnce({
      data: { id: LISTING_ID, seller_id: USER_ID, status: "active" },
      error: null,
    });
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "DB error", code: "PGRST" },
    });

    const result = await applyDopingToListing(LISTING_ID, USER_ID, [...DOPING_TYPES]);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/kontrol edilemedi/i);
  });

  it("returns error when listing is not found", async () => {
    const LISTING_ID = "listing-5";
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "not found" },
    });

    const result = await applyDopingToListing(LISTING_ID, USER_ID, [...DOPING_TYPES]);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/ilan bulunamadı/i);
  });

  it("returns error when listing belongs to a different user", async () => {
    const LISTING_ID = "listing-6";
    mockSingle.mockResolvedValueOnce({
      data: { id: LISTING_ID, seller_id: "other", status: "active" },
      error: null,
    });

    const result = await applyDopingToListing(LISTING_ID, USER_ID, [...DOPING_TYPES]);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/ilan bulunamadı/i);
  });
});
