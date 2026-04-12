import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyListingWithEIDS } from '../eids-mock';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

vi.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: vi.fn(),
}));

describe('eids-mock service', () => {
  const createChainMock = () => {
    const mock: any = {
      from: vi.fn(() => mock),
      select: vi.fn(() => mock),
      eq: vi.fn(() => mock),
      update: vi.fn(() => mock),
      single: vi.fn().mockImplementation(() => Promise.resolve({ data: mock._data, error: mock._error })),
      insert: vi.fn().mockImplementation(() => Promise.resolve({ data: mock._data, error: mock._error })),
      // Default to resolving to { data, error } when awaited directly
      then: vi.fn().mockImplementation((onFulfilled) => 
        Promise.resolve({ data: mock._data, error: mock._error }).then(onFulfilled)
      ),
      _data: null,
      _error: null,
    };
    return mock;
  };

  let mockAdmin: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAdmin = createChainMock();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(mockAdmin);
  });

  it('should fail if identity is not verified', async () => {
    mockAdmin._data = { identity_verified: false };

    const result = await verifyListingWithEIDS('listing-1', 'user-1');
    expect(result.success).toBe(false);
    expect(result.message).toContain('doğrulaması tamamlanmamış');
  });

  it('should succeed if identity is verified', async () => {
    // 1st call for profile check
    mockAdmin._data = { identity_verified: true };
    // 2nd call for update (will use same mockAdmin, which is fine as long as we don't care about the return data for update)

    const result = await verifyListingWithEIDS('listing-1', 'user-1');
    expect(result.success).toBe(true);
    expect(result.data?.listingAuthorized).toBe(true);
    expect(result.data?.eidsId).toMatch(/^EIDS-/);
  });

  it('should fail if database update fails', async () => {
    // We need to return success for the first call (select) and failure for the second (update)
    // To handle multiple different calls, we can use mockImplementationOnce
    
    mockAdmin.single.mockResolvedValueOnce({ data: { identity_verified: true }, error: null });
    // For the update call, which is awaited as a thenable
    mockAdmin.then.mockImplementationOnce((onFulfilled: any) => 
      Promise.resolve({ data: null, error: { message: 'Update failed' } }).then(onFulfilled)
    );

    const result = await verifyListingWithEIDS('listing-1', 'user-1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Database update failed');
  });
});
