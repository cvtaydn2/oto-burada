import { describe, it, expect } from 'vitest';
import { filterListings, sortListings, parseListingFiltersFromSearchParams } from '../listing-filters';
import { Listing, ListingFilters } from '@/types';

describe('listing-filters logic', () => {
  const mockListings: Listing[] = [
    {
      id: '1',
      title: 'BMW 320i Sahibinden',
      brand: 'BMW',
      model: '320i',
      year: 2020,
      price: 1500000,
      mileage: 50000,
      city: 'İstanbul',
      district: 'Beşiktaş',
      fuelType: 'benzin',
      transmission: 'otomatik',
      createdAt: '2024-01-02T10:00:00Z',
    } as Listing,
    {
      id: '2',
      title: 'Mercedes C200 Temiz',
      brand: 'Mercedes',
      model: 'C200',
      year: 2022,
      price: 2500000,
      mileage: 20000,
      city: 'Ankara',
      district: 'Çankaya',
      fuelType: 'dizel',
      transmission: 'otomatik',
      createdAt: '2024-01-01T10:00:00Z',
    } as Listing,
  ];

  describe('filterListings', () => {
    it('should filter by brand', () => {
      const filters: ListingFilters = { brand: 'BMW' };
      const result = filterListings(mockListings, filters);
      expect(result).toHaveLength(1);
      expect(result[0].brand).toBe('BMW');
    });

    it('should be case-insensitive and Turkish-aware', () => {
      const filters: ListingFilters = { city: 'istanbul' }; // Lowercase i -> should match İstanbul
      const result = filterListings(mockListings, filters);
      expect(result).toHaveLength(1);
      expect(result[0].city).toBe('İstanbul');
    });

    it('should filter by price range', () => {
      const filters: ListingFilters = { minPrice: 2000000 };
      const result = filterListings(mockListings, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should filter by query string', () => {
      const filters: ListingFilters = { query: 'temiz' };
      const result = filterListings(mockListings, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });
  });

  describe('sortListings', () => {
    it('should sort by newest by default', () => {
      const result = sortListings(mockListings);
      expect(result[0].id).toBe('1'); // 2024-01-02 vs 2024-01-01
    });

    it('should sort by price ascending', () => {
      const result = sortListings(mockListings, 'price_asc');
      expect(result[0].price).toBe(1500000);
    });
  });

  describe('parseListingFiltersFromSearchParams', () => {
    it('should parse year filters correctly', () => {
      const params = { minYear: '2021' };
      const result = parseListingFiltersFromSearchParams(params);
      expect(result.minYear).toBe(2021);
    });

    it('should handle undefined params', () => {
      const result = parseListingFiltersFromSearchParams(undefined);
      expect(result.sort).toBe('newest');
    });
  });
});
