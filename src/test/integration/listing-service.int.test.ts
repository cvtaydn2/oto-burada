import { describe, it, expect } from 'vitest';
import { getFilteredMarketplaceListings, getMarketplaceListingBySlug } from '../../services/listings/marketplace-listings';

describe('Listing Service (Integration)', () => {
  it('should fetch filtered listings', async () => {
    const result = await getFilteredMarketplaceListings({ page: 1, limit: 10 });
    expect(result.listings).toBeDefined();
    expect(Array.isArray(result.listings)).toBe(true);
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  it('should find a listing by slug if approved', async () => {
    // 1. Get an approved listing slug first
    const result = await getFilteredMarketplaceListings({ page: 1, limit: 1 });
    if (result.listings.length > 0) {
      const slug = result.listings[0].slug;
      const listing = await getMarketplaceListingBySlug(slug);
      
      // Note: Only tests 'approved' listings based on service logic
      if (result.listings[0].status === 'approved') {
        expect(listing).not.toBeNull();
        expect(listing?.slug).toBe(slug);
      }
    }
  });

  it('should fetch similar listings', async () => {
    const result = await getFilteredMarketplaceListings({ page: 1, limit: 1 });
    if (result.listings.length > 0) {
      const { slug, brand, city } = result.listings[0];
      const similar = await import('../../services/listings/marketplace-listings').then(m => 
        m.getSimilarMarketplaceListings(slug, brand!, city!)
      );
      expect(Array.isArray(similar)).toBe(true);
    }
  });
});
