/**
 * Tests: doping-service — duplicate payment / idempotency conflict
 * Risk: tekrar tıklama ve duplicate-init davranışı tekrar generic error'a dönebilir.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/env", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
}));

vi.mock("@/lib/payment/config", () => ({
  isPaymentEnabled: vi.fn(() => true),
}));

vi.mock("@/lib/payment/constants", () => ({
  DOPING_PRICES: {
    featured: { price: 199 },
    urgent: { price: 99 },
    highlighted: { price: 49 },
  },
}));

vi.mock("@/lib/payment", () => ({
  payment: {
    processPayment: vi.fn(),
  },
}));

// ── Supabase admin mock ────────────────────────────────────────────────────────
// We build a chainable mock that can be configured per-test
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockRpc = vi.fn();

function buildChain() {
  const chain = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    eq: mockEq,
    order: mockOrder,
    limit: mockLimit,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  };

  // Make every method return the chain (fluent interface)
  mockSelect.mockReturnValue(chain);
  mockInsert.mockReturnValue(chain);
  mockUpdate.mockReturnValue(chain);
  mockEq.mockReturnValue(chain);
  mockOrder.mockReturnValue(chain);
  mockLimit.mockReturnValue(chain);

  return chain;
}

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from: vi.fn(() => buildChain()),
    rpc: mockRpc,
  })),
}));

import { payment } from "@/lib/payment";
import { applyDopingToListing } from "@/services/market/doping-service";

const LISTING_ID = "listing-xyz";
const USER_ID = "user-abc";
const DOPING_TYPES = ["featured"] as const;

describe("applyDopingToListing — idempotency / duplicate payment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildChain();
  });

  it("returns fail-closed when payment is already fulfilled (status=success)", async () => {
    // Listing lookup → found
    mockSingle.mockResolvedValueOnce({
      data: { id: LISTING_ID, seller_id: USER_ID, status: "active" },
      error: null,
    });
    // Existing payment lookup → already succeeded
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
    expect(result.transactionId).toBe("tok-existing");
    expect(payment.processPayment).not.toHaveBeenCalled();
  });

  it("returns fail-closed when there is a pending payment with token (3DS in progress)", async () => {
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

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/bekleyen.*ödeme/i);
    expect(result.transactionId).toBe("tok-pending");
    expect(payment.processPayment).not.toHaveBeenCalled();
  });

  it("handles DB unique constraint violation (23505) on insert by returning pending message", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: LISTING_ID, seller_id: USER_ID, status: "active" },
      error: null,
    });
    // No existing payment found initially
    mockMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null }) // first check
      // After 23505 conflict, lookup for existing pending
      .mockResolvedValueOnce({
        data: { id: "pay-3", iyzico_token: "tok-conflict" },
        error: null,
      });

    // Insert fails with unique constraint
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: "23505", message: "duplicate key value" },
    });

    const result = await applyDopingToListing(LISTING_ID, USER_ID, [...DOPING_TYPES]);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/bekleyen.*ödeme/i);
  });

  it("returns error when existing payment check itself fails", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: LISTING_ID, seller_id: USER_ID, status: "active" },
      error: null,
    });
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "DB connection error", code: "PGRST301" },
    });

    const result = await applyDopingToListing(LISTING_ID, USER_ID, [...DOPING_TYPES]);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/kontrol edilemedi/i);
    expect(payment.processPayment).not.toHaveBeenCalled();
  });

  it("returns error when listing is not found or archived", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "not found" },
    });

    const result = await applyDopingToListing(LISTING_ID, USER_ID, [...DOPING_TYPES]);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/ilan bulunamadı/i);
  });

  it("returns error when listing belongs to a different user", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: LISTING_ID, seller_id: "other-user", status: "active" },
      error: null,
    });

    const result = await applyDopingToListing(LISTING_ID, USER_ID, [...DOPING_TYPES]);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/ilan bulunamadı/i);
  });
});
