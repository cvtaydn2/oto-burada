import { describe, it, expect, vi, beforeEach } from 'vitest';
import { moderateListingWithSideEffects, moderateListingsWithSideEffects } from '../listing-moderation';
import * as listingSubmissions from '@/services/listings/listing-submissions';
import * as moderationActions from '../moderation-actions';
import * as notifications from '@/services/notifications/notification-records';
import type { Listing } from '@/types';

// Mock dependencies
vi.mock('@/services/listings/listing-submissions');
vi.mock('../moderation-actions');
vi.mock('@/services/notifications/notification-records');
vi.mock('@/lib/redis/client', () => ({
  invalidateCache: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/services/market/market-stats', () => ({
  updateMarketStats: vi.fn().mockResolvedValue(undefined),
}));

describe('listing-moderation service', () => {
  const mockListing: Listing = {
    id: 'listing-123',
    slug: 'test-car',
    title: 'Test Car',
    sellerId: 'seller-456',
    brand: 'Fiat',
    model: 'Egea',
    year: 2022,
    mileage: 15000,
    fuelType: 'benzin',
    transmission: 'otomatik',
    price: 1000000,
    city: 'Istanbul',
    district: 'Kadikoy',
    description: 'Test description',
    whatsappPhone: '905551112233',
    status: 'pending',
    images: [],
    featured: false,
    viewCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('moderateListingWithSideEffects', () => {
    it('should approve a listing and trigger side effects', async () => {
      vi.mocked(listingSubmissions.moderateDatabaseListing).mockResolvedValue({
        ...mockListing,
        status: 'approved',
      });

      const result = await moderateListingWithSideEffects({
        action: 'approve',
        adminUserId: 'admin-1',
        listingId: 'listing-123',
      });

      expect(result?.status).toBe('approved');
      expect(listingSubmissions.moderateDatabaseListing).toHaveBeenCalledWith('listing-123', 'approved');
      expect(moderationActions.createAdminModerationAction).toHaveBeenCalled();
      expect(notifications.createDatabaseNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'moderation',
          title: 'Ilanin onaylandi',
        })
      );
    });

    it('should reject a listing and trigger side effects', async () => {
      vi.mocked(listingSubmissions.moderateDatabaseListing).mockResolvedValue({
        ...mockListing,
        status: 'rejected',
      });

      const result = await moderateListingWithSideEffects({
        action: 'reject',
        adminUserId: 'admin-1',
        listingId: 'listing-123',
        note: 'Invalid description',
      });

      expect(result?.status).toBe('rejected');
      expect(listingSubmissions.moderateDatabaseListing).toHaveBeenCalledWith('listing-123', 'rejected');
      expect(moderationActions.createAdminModerationAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'reject',
          note: 'Invalid description',
        })
      );
    });

    it('should return null if database update fails', async () => {
      vi.mocked(listingSubmissions.moderateDatabaseListing).mockResolvedValue(null);

      const result = await moderateListingWithSideEffects({
        action: 'approve',
        adminUserId: 'admin-1',
        listingId: 'missing-id',
      });

      expect(result).toBeNull();
      expect(notifications.createDatabaseNotification).not.toHaveBeenCalled();
    });
  });

  describe('moderateListingsWithSideEffects', () => {
    it('should handle multiple listings', async () => {
      vi.mocked(listingSubmissions.moderateDatabaseListing).mockResolvedValueOnce({ ...mockListing, id: '1' });
      vi.mocked(listingSubmissions.moderateDatabaseListing).mockResolvedValueOnce({ ...mockListing, id: '2' });

      const result = await moderateListingsWithSideEffects({
        action: 'approve',
        adminUserId: 'admin-1',
        listingIds: ['1', '2'],
      });

      expect(result.moderatedListings).toHaveLength(2);
      expect(result.skippedListingIds).toHaveLength(0);
    });

    it('should track skipped listings', async () => {
      vi.mocked(listingSubmissions.moderateDatabaseListing).mockResolvedValueOnce({ ...mockListing, id: '1' });
      vi.mocked(listingSubmissions.moderateDatabaseListing).mockResolvedValueOnce(null);

      const result = await moderateListingsWithSideEffects({
        action: 'approve',
        adminUserId: 'admin-1',
        listingIds: ['1', 'missing'],
      });

      expect(result.moderatedListings).toHaveLength(1);
      expect(result.skippedListingIds).toContain('missing');
    });
  });
});
