import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAdminAnalytics } from '../analytics';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

vi.mock('@/lib/supabase/admin');
vi.mock('@/lib/supabase/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/supabase/env')>();
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

describe('admin analytics service', () => {
  const mockFrom = vi.fn();
  const mockAdminClient = {
    from: mockFrom,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(mockAdminClient as never);
  });

  it('should calculate correct KPIs and trends', async () => {
    // Mock the chain for many different queries
    // Promise.all in analytics.ts expects 16 results
    mockFrom.mockImplementation((table: string) => ({
      select: vi.fn().mockImplementation((_col: string, opts?: { count?: string }) => {
        const query = {
          limit: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          then: (resolve: (value: MockQueryResult) => unknown) => {
            // Return different data based on the table
            if (table === 'listings') {
              if (opts?.count === 'exact') resolve({ count: 100, data: null, error: null });
              else resolve({ data: [{ brand: 'BMW', created_at: new Date().toISOString() }, { brand: 'BMW', created_at: new Date().toISOString() }, { brand: 'Audi', created_at: new Date().toISOString() }], error: null });
            } else if (table === 'profiles') {
              resolve({ count: 50, data: null, error: null });
            } else if (table === 'payments') {
              resolve({ data: [{ amount: 1000 }, { amount: 500 }], error: null });
            } else if (table === 'reports') {
              resolve({ count: 5, data: null, error: null });
            } else if (table === 'market_stats') {
              resolve({ data: [{ brand: 'BMW', avg_price: 1500000 }], error: null });
            } else {
              resolve({ data: [], error: null });
            }
          }
        };
        return query;
      })
    }));

    const result = await getAdminAnalytics('30d');

    expect(result).not.toBeNull();
    if (result) {
      expect(result.kpis.totalListings).toBe(100);
      expect(result.kpis.totalUsers).toBe(50);
      expect(result.kpis.totalRevenue).toBe(1500);
      expect(result.listingsByBrand[0].brand).toBe('BMW');
      expect(result.listingsByBrand[0].count).toBe(2);
    }
  });

  it('should return null if env is missing', async () => {
    const { hasSupabaseAdminEnv } = await import('@/lib/supabase/env');
    vi.mocked(hasSupabaseAdminEnv).mockReturnValue(false);

    const result = await getAdminAnalytics();
    expect(result).toBeNull();
  });
});
