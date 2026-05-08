import { beforeEach, describe, expect, it, vi } from "vitest";

import { getListingPriceHistory } from "../listing-price-history";

const mockMaybeSingle = vi.fn();
const mockOrder = vi.fn();
const mockEqHistory = vi.fn();
const mockSelectHistory = vi.fn();
const mockEqStatus = vi.fn();
const mockEqId = vi.fn();
const mockSelectListings = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: vi.fn(() => true),
  hasSupabaseAdminEnv: vi.fn(() => true),
}));

vi.mock("@/lib/public-server", () => ({
  createSupabasePublicServerClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

describe("getListingPriceHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSelectListings.mockReturnValue({ eq: mockEqId });
    mockEqId.mockReturnValue({ eq: mockEqStatus });
    mockEqStatus.mockReturnValue({ maybeSingle: mockMaybeSingle });

    mockSelectHistory.mockReturnValue({ eq: mockEqHistory });
    mockEqHistory.mockReturnValue({ order: mockOrder });

    mockFrom.mockImplementation((table: string) => {
      if (table === "listings") {
        return { select: mockSelectListings };
      }
      if (table === "listing_price_history") {
        return { select: mockSelectHistory };
      }
      return { select: vi.fn() };
    });
  });

  it("non-public listing için boş dizi döner", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await getListingPriceHistory("c7f1cf6c-8f3d-4f8d-afdd-d0d9dcae839e");

    expect(result).toEqual([]);
    expect(mockFrom).toHaveBeenCalledWith("listings");
    expect(mockFrom).not.toHaveBeenCalledWith("listing_price_history");
  });

  it("public/approved listing için fiyat geçmişini döner", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: "listing-1" }, error: null });
    mockOrder.mockResolvedValue({
      data: [
        { price: "1000000", created_at: "2025-01-01T10:00:00.000Z" },
        { price: "950000", created_at: "2025-02-01T10:00:00.000Z" },
      ],
      error: null,
    });

    const result = await getListingPriceHistory("c7f1cf6c-8f3d-4f8d-afdd-d0d9dcae839e");

    expect(result).toEqual([
      { price: 1000000, date: "2025-01-01T10:00:00.000Z" },
      { price: 950000, date: "2025-02-01T10:00:00.000Z" },
    ]);
    expect(mockFrom).toHaveBeenCalledWith("listing_price_history");
  });
});
