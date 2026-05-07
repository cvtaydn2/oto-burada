import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseAdminClient } from "@/features/shared/lib/admin";

import { getAdminAnalytics } from "../analytics";

vi.mock("@/features/shared/lib/admin");
vi.mock("@/features/shared/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/shared/lib/env")>();
  return {
    ...actual,
    hasSupabaseAdminEnv: vi.fn(() => true),
  };
});

type MockQueryResult = {
  count?: number | null;
  data: unknown;
  error: unknown;
};

describe("admin analytics service", () => {
  const mockFrom = vi.fn();
  const mockRpc = vi.fn();
  const mockAdminClient = {
    from: mockFrom,
    rpc: mockRpc,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(mockAdminClient as never);
  });

  it("should calculate correct KPIs and trends", async () => {
    mockRpc.mockImplementation((fn: string) => {
      if (fn === "get_listings_by_brand_count") {
        return Promise.resolve({
          data: [
            { brand: "BMW", count: 2 },
            { brand: "Audi", count: 1 },
          ],
          error: null,
        });
      }
      if (fn === "get_listings_by_city_count") {
        return Promise.resolve({ data: [{ city: "İstanbul", count: 3 }], error: null });
      }
      if (fn === "get_listings_by_status_count") {
        return Promise.resolve({ data: [{ status: "approved", count: 3 }], error: null });
      }
      if (fn === "get_revenue_stats") {
        return Promise.resolve({ data: [{ total_amount: 1500 }], error: null });
      }
      if (fn === "get_daily_listing_trend") {
        return Promise.resolve({
          data: [{ day: new Date().toISOString().split("T")[0], count: 4 }],
          error: null,
        });
      }
      return Promise.resolve({ data: [], error: null });
    });

    mockFrom.mockImplementation((table: string) => ({
      select: vi.fn().mockImplementation(() => {
        const result: MockQueryResult =
          table === "profiles"
            ? { count: 50, data: null, error: null }
            : table === "listings"
              ? { count: 100, data: null, error: null }
              : table === "market_stats"
                ? { data: [{ brand: "BMW", avg_price: 1500000 }], error: null }
                : { data: [], error: null };
        const query = {
          limit: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          then: (resolve: (value: MockQueryResult) => unknown) => resolve(result),
        };
        return query;
      }),
    }));

    const result = await getAdminAnalytics("30d");

    expect(result).not.toBeNull();
    if (result) {
      expect(result.kpis.totalListings).toBe(100);
      expect(result.kpis.totalUsers).toBe(50);
      expect(result.kpis.totalRevenue).toBe(1500);
      expect(result.listingsByBrand[0].brand).toBe("BMW");
      expect(result.listingsByBrand[0].count).toBe(2);
    }
  });

  it("should return null if env is missing", async () => {
    const { hasSupabaseAdminEnv } = await import("@/features/shared/lib/env");
    vi.mocked(hasSupabaseAdminEnv).mockReturnValue(false);

    const result = await getAdminAnalytics();
    expect(result).toBeNull();
  });
});
