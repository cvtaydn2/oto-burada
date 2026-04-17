import { describe, it, expect } from 'vitest';
import {
  listingCreateSchema,
  listingFiltersSchema,
  profileSchema,
  reportCreateSchema,
  savedSearchCreateSchema,
} from '../domain';

// ── Shared fixtures ──────────────────────────────────────────────────────────

const validListingInput = {
  title: 'BMW 320i Temiz Araç',
  brand: 'BMW',
  model: '320i',
  year: 2020,
  mileage: 50000,
  fuelType: 'benzin',
  transmission: 'otomatik',
  price: 1500000,
  city: 'İstanbul',
  district: 'Beşiktaş',
  description: 'Çok temiz, bakımlı araç. Hasarsız, boyasız.',
  whatsappPhone: '905551234567',
  vin: 'WBA12345678901234',
  images: [
    { storagePath: 'listings/user/uuid.jpg', url: 'https://example.supabase.co/storage/v1/object/public/listing-images/listings/user/uuid.jpg', order: 0, isCover: true },
    { storagePath: 'listings/user/uuid2.jpg', url: 'https://example.supabase.co/storage/v1/object/public/listing-images/listings/user/uuid2.jpg', order: 1, isCover: false },
    { storagePath: 'listings/user/uuid3.jpg', url: 'https://example.supabase.co/storage/v1/object/public/listing-images/listings/user/uuid3.jpg', order: 2, isCover: false },
  ],
};

// ── listingCreateSchema ──────────────────────────────────────────────────────

describe('listingCreateSchema', () => {
  it('accepts a valid listing', () => {
    const result = listingCreateSchema.safeParse(validListingInput);
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const { title: _t, ...withoutTitle } = validListingInput;
    const result = listingCreateSchema.safeParse(withoutTitle);
    expect(result.success).toBe(false);
  });

  it('rejects price of 0', () => {
    const result = listingCreateSchema.safeParse({ ...validListingInput, price: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative price', () => {
    const result = listingCreateSchema.safeParse({ ...validListingInput, price: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects year below minimum (1950)', () => {
    const result = listingCreateSchema.safeParse({ ...validListingInput, year: 1900 });
    expect(result.success).toBe(false);
  });

  it('rejects year above maximum (2100)', () => {
    const result = listingCreateSchema.safeParse({ ...validListingInput, year: 2200 });
    expect(result.success).toBe(false);
  });

  it('rejects negative mileage', () => {
    const result = listingCreateSchema.safeParse({ ...validListingInput, mileage: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid fuel type', () => {
    const result = listingCreateSchema.safeParse({ ...validListingInput, fuelType: 'petrol' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid transmission type', () => {
    const result = listingCreateSchema.safeParse({ ...validListingInput, transmission: 'cvt' });
    expect(result.success).toBe(false);
  });

  it('rejects VIN shorter than 17 chars', () => {
    const result = listingCreateSchema.safeParse({ ...validListingInput, vin: 'SHORT' });
    expect(result.success).toBe(false);
  });

  it('rejects VIN with invalid characters (I, O, Q)', () => {
    const result = listingCreateSchema.safeParse({ ...validListingInput, vin: 'WBAIOQ45678901234' });
    expect(result.success).toBe(false);
  });

  it('accepts valid VIN exactly 17 chars', () => {
    const result = listingCreateSchema.safeParse({ ...validListingInput, vin: 'WBA12345678901234' });
    expect(result.success).toBe(true);
  });

  it('rejects description shorter than 20 chars', () => {
    const result = listingCreateSchema.safeParse({ ...validListingInput, description: 'Too short' });
    expect(result.success).toBe(false);
  });

  it('coerces string price to number', () => {
    const result = listingCreateSchema.safeParse({ ...validListingInput, price: '1500000' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.price).toBe(1500000);
  });

  it('coerces string year to number', () => {
    const result = listingCreateSchema.safeParse({ ...validListingInput, year: '2020' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.year).toBe(2020);
  });

  it('accepts optional carTrim as null', () => {
    const result = listingCreateSchema.safeParse({ ...validListingInput, carTrim: null });
    expect(result.success).toBe(true);
  });

  it('accepts optional tramerAmount as 0', () => {
    const result = listingCreateSchema.safeParse({ ...validListingInput, tramerAmount: 0 });
    expect(result.success).toBe(true);
  });
});

// ── listingFiltersSchema ─────────────────────────────────────────────────────

describe('listingFiltersSchema', () => {
  it('accepts empty filters', () => {
    const result = listingFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts valid sort option', () => {
    const result = listingFiltersSchema.safeParse({ sort: 'price_asc' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid sort option', () => {
    const result = listingFiltersSchema.safeParse({ sort: 'random' });
    expect(result.success).toBe(false);
  });

  it('coerces string page to number', () => {
    const result = listingFiltersSchema.safeParse({ page: '2' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.page).toBe(2);
  });

  it('rejects page 0', () => {
    const result = listingFiltersSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative minPrice', () => {
    const result = listingFiltersSchema.safeParse({ minPrice: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects minYear below 1950', () => {
    const result = listingFiltersSchema.safeParse({ minYear: 1900 });
    expect(result.success).toBe(false);
  });

  it('rejects maxYear above 2100', () => {
    const result = listingFiltersSchema.safeParse({ maxYear: 2200 });
    expect(result.success).toBe(false);
  });

  it('rejects minPrice greater than maxPrice', () => {
    const result = listingFiltersSchema.safeParse({ minPrice: 2000000, maxPrice: 1000000 });
    expect(result.success).toBe(false);
  });

  it('rejects minYear greater than maxYear', () => {
    const result = listingFiltersSchema.safeParse({ minYear: 2022, maxYear: 2020 });
    expect(result.success).toBe(false);
  });

  it('accepts valid fuel type filter', () => {
    const result = listingFiltersSchema.safeParse({ fuelType: 'elektrik' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid fuel type filter', () => {
    const result = listingFiltersSchema.safeParse({ fuelType: 'hydrogen' });
    expect(result.success).toBe(false);
  });
});

// ── reportCreateSchema ───────────────────────────────────────────────────────

describe('reportCreateSchema', () => {
  it('accepts valid report', () => {
    const result = reportCreateSchema.safeParse({
      listingId: 'listing-123',
      reason: 'fake_listing',
      description: 'Bu ilan sahte görünüyor.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing listingId', () => {
    const result = reportCreateSchema.safeParse({ reason: 'fake_listing' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid reason', () => {
    const result = reportCreateSchema.safeParse({
      listingId: 'listing-123',
      reason: 'i_dont_like_it',
    });
    expect(result.success).toBe(false);
  });

  it('rejects description shorter than 5 chars', () => {
    const result = reportCreateSchema.safeParse({
      listingId: 'listing-123',
      reason: 'spam',
      description: 'bad',
    });
    expect(result.success).toBe(false);
  });

  it('accepts report without description', () => {
    const result = reportCreateSchema.safeParse({
      listingId: 'listing-123',
      reason: 'spam',
    });
    expect(result.success).toBe(true);
  });
});

// ── savedSearchCreateSchema ──────────────────────────────────────────────────

describe('savedSearchCreateSchema', () => {
  it('accepts valid saved search', () => {
    const result = savedSearchCreateSchema.safeParse({
      title: 'BMW İstanbul',
      filters: { brand: 'BMW', city: 'İstanbul' },
      notificationsEnabled: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts saved search without title (optional)', () => {
    const result = savedSearchCreateSchema.safeParse({
      filters: { brand: 'BMW' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects title longer than 120 chars', () => {
    const result = savedSearchCreateSchema.safeParse({
      title: 'a'.repeat(121),
      filters: {},
    });
    expect(result.success).toBe(false);
  });
});

// ── profileSchema ────────────────────────────────────────────────────────────

describe('profileSchema', () => {
  const validProfile = {
    id: 'user-123',
    fullName: 'Ahmet Yılmaz',
    phone: '905551234567',
    city: 'İstanbul',
    emailVerified: true,
    phoneVerified: false,
    identityVerified: false,
    isVerified: false,
    role: 'user',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  it('accepts a valid profile', () => {
    const result = profileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it('rejects invalid role', () => {
    const result = profileSchema.safeParse({ ...validProfile, role: 'superadmin' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid phone format', () => {
    const result = profileSchema.safeParse({ ...validProfile, phone: 'not-a-phone' });
    expect(result.success).toBe(false);
  });

  it('accepts empty phone (lenient schema)', () => {
    // Phone is lenient — empty string is allowed
    const result = profileSchema.safeParse({ ...validProfile, phone: '' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid avatar URL', () => {
    const result = profileSchema.safeParse({ ...validProfile, avatarUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('accepts null avatar URL', () => {
    const result = profileSchema.safeParse({ ...validProfile, avatarUrl: null });
    expect(result.success).toBe(true);
  });
});
