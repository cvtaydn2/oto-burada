import { describe, it, expect } from 'vitest';
import { calculateFraudScore, buildListingSlug } from '../listing-submissions';
import { Listing, ListingCreateInput } from '@/types';

describe('listing-submissions logic', () => {
  const mockInput: ListingCreateInput = {
    title: 'Clean Car',
    brand: 'BMW',
    model: '320i',
    year: 2020,
    mileage: 50000,
    fuelType: 'benzin',
    transmission: 'otomatik',
    price: 1500000,
    city: 'İstanbul',
    district: 'Beşiktaş',
    description: 'Very clean car',
    whatsappPhone: '905551234567',
    vin: 'WBA12345678901234',
    images: [],
  };

  describe('calculateFraudScore', () => {
    it('should return 0 for a clean listing', () => {
      const result = calculateFraudScore(mockInput, []);
      expect(result.fraudScore).toBe(0);
      expect(result.fraudReason).toBeNull();
    });

    it('should detect duplicate listings', () => {
      const existingListing = { 
        ...mockInput, 
        id: '1', 
        sellerId: 'other-seller', 
        vin: 'OTHER-VIN-12345678', // Different VIN
        slug: 'old', 
        createdAt: '', 
        updatedAt: '', 
        status: 'approved' 
      } as Listing;
      const result = calculateFraudScore(mockInput, [existingListing]);
      expect(result.fraudScore).toBe(50);
      expect(result.fraudReason).toContain('Mükerrer ilan şüphesi');
    });

    it('should detect VIN cloning', () => {
      const existingListing = { ...mockInput, id: '1', sellerId: 'other-seller', vin: mockInput.vin, slug: 'old', createdAt: '', updatedAt: '', status: 'approved' } as Listing;
      const result = calculateFraudScore(mockInput, [existingListing]);
      expect(result.fraudScore).toBe(100);
      expect(result.fraudReason).toContain('VIN clone');
    });

    it('should flag suspicious low price for new cars', () => {
      const cheapInput = { ...mockInput, year: 2024, price: 150000 };
      const result = calculateFraudScore(cheapInput, []);
      expect(result.fraudScore).toBe(60);
      expect(result.fraudReason).toContain('şüpheli fiyat');
    });

    it('should flag many damage parts with zero tramer', () => {
      const suspiciousDamageInput = { 
        ...mockInput, 
        tramerAmount: 0, 
        damageStatusJson: { 'kaput': 'degisen', 'tavan': 'boyali', 'bagaj': 'degisen' } 
      };
      const result = calculateFraudScore(suspiciousDamageInput, []);
      expect(result.fraudScore).toBe(20);
      expect(result.fraudReason).toContain('hasar kaydı 0');
    });
  });

  describe('buildListingSlug', () => {
    it('should generate a simple slug', () => {
      const slug = buildListingSlug(mockInput, []);
      expect(slug).toBe('2020-bmw-320i-clean-car');
    });

    it('should handle Turkish characters', () => {
      const turkishInput = { ...mockInput, title: 'Çok Özel Şahane Araç' };
      const slug = buildListingSlug(turkishInput, []);
      expect(slug).toBe('2020-bmw-320i-cok-ozel-sahane-arac');
    });

    it('should avoid collisions by adding suffixes', () => {
      const existing = { slug: '2020-bmw-320i-clean-car' } as Listing;
      const slug = buildListingSlug(mockInput, [existing]);
      expect(slug).toBe('2020-bmw-320i-clean-car-2');
    });
  });
});
