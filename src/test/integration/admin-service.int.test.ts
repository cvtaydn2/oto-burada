import { describe, it, expect } from 'vitest';
import { getAdminAnalytics } from '../../services/admin/analytics';

describe('Admin Service (Integration)', () => {
  it('should fetch real admin analytics', async () => {
    const stats = await getAdminAnalytics();
    
    expect(stats).not.toBeNull();
    if (!stats) return; // Guard for TS types

    expect(stats.kpis).toBeDefined();
    expect(stats.kpis.totalListings).toBeGreaterThanOrEqual(0);
    expect(stats.kpis.pendingApproval).toBeGreaterThanOrEqual(0);
    
    expect(stats.listingsByStatus).toBeDefined();
    expect(Array.isArray(stats.listingsByStatus)).toBe(true);
  }, 15000);
});
