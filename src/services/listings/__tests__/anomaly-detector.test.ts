import { describe, it, expect } from 'vitest';
import { calculateFraudScore } from '../listing-submissions';

describe('AI AnomalyDetector (calculateFraudScore)', () => {
  const mockBaseInput = {
    title: 'Sahibinden temiz',
    description: 'Aile aracı',
    brand: 'Audi',
    model: 'A3',
    year: 2022,
    price: 1_200_000,
    mileage: 45000,
    fuelType: 'benzin',
    transmission: 'otomatik',
    bodyType: 'hatchback',
    city: 'İstanbul',
    district: 'Kadıköy',
    tramerAmount: null,
    damageStatusJson: null,
  };

  const existingListingsBase = [
    { id: '1', slug: 'l-1', brand: 'Audi', model: 'A3', year: 2022, price: 1_150_000, mileage: 40000 },
    { id: '2', slug: 'l-2', brand: 'Audi', model: 'A3', year: 2022, price: 1_250_000, mileage: 50000 },
    { id: '3', slug: 'l-3', brand: 'Audi', model: 'A3', year: 2022, price: 1_200_000, mileage: 45000 },
  ];

  it('should return 0 fraud score and no flagged status for normal listings', () => {
    // Exact match is filtered if the inputs don't line up exactly, 
    // wait I'll change price slightly to avoid duplicate logic triggering
    const input = { ...mockBaseInput, price: 1_200_001 };
    
    // Average price = (1.15M + 1.25M + 1.2M) / 3 = 1.2M
    // 1.2M is within 70% and 150% limits
    const result = calculateFraudScore(input as any, existingListingsBase) as any;
    expect(result.fraudScore).toBe(0);
    expect(result.fraudReason).toBeNull();
    expect(result.suggestedStatus).toBeUndefined();
  });

  it('should flag listing when price is 30% below market average', () => {
    // Average 1.2M, 30% below is 840,000 TL
    const input = { ...mockBaseInput, price: 800_000 };
    const result = calculateFraudScore(input as any, existingListingsBase) as any;
    
    expect(result.fraudScore).toBeGreaterThanOrEqual(70);
    expect(result.fraudReason).toContain('Fiyat ortalamanın %30 altında');
    expect(result.suggestedStatus).toBe('flagged');
  });

  it('should flag listing when price is 50% above market average', () => {
    // Average 1.2M, 50% above is 1.8M TL
    const input = { ...mockBaseInput, price: 1_900_000 };
    const result = calculateFraudScore(input as any, existingListingsBase) as any;
    
    expect(result.fraudScore).toBeGreaterThanOrEqual(50);
    expect(result.fraudReason).toContain('Fiyat ortalamanın %50 üzerinde');
    expect(result.suggestedStatus).toBe('flagged');
  });

  it('should use fallback price check when less than 3 comparable cars exist', () => {
    const input = { ...mockBaseInput, year: 2023, price: 600_000 };
    // Pass empty array for existing listings
    const result = calculateFraudScore(input as any, []) as any;
    
    expect(result.fraudScore).toBeGreaterThanOrEqual(60);
    expect(result.fraudReason).toContain('Pazar ortalamasının çok altında şüpheli fiyat');
  });

  it('should flag mileage_anomaly for old vehicle with unrealistic low mileage', () => {
    const currentYear = new Date().getFullYear();
    const input = { ...mockBaseInput, year: currentYear - 11, mileage: 5000, price: 1_200_001 }; // 11 years old, 5k km
    const result = calculateFraudScore(input as any, []) as any;
    
    expect(result.fraudScore).toBeGreaterThanOrEqual(40);
    expect(result.fraudReason).toContain('mileage_anomaly');
    expect(result.suggestedStatus).toBe('flagged');
  });

  it('should flag duplicate listing (spam detection)', () => {
    const duplicateInput = { ...mockBaseInput }; // Same as existingListingsBase[2]
    const result = calculateFraudScore(duplicateInput as any, existingListingsBase) as any;
    
    // 50 points directly for exact duplicate
    expect(result.fraudScore).toBeGreaterThanOrEqual(50);
    expect(result.fraudReason).toContain('Mükerrer ilan şüphesi');
  });

  it('should flag VIN cloning attempts', () => {
    const inputWithVin = { ...mockBaseInput, vin: 'ABCDEF123456', price: 1_200_001 };
    const existingWithVin = [
      ...existingListingsBase,
      { id: '10', slug: 'l-10', vin: 'ABCDEF123456', status: 'approved' },
    ];
    
    const result = calculateFraudScore(inputWithVin as any, existingWithVin) as any;
    
    expect(result.fraudScore).toBeGreaterThanOrEqual(100);
    expect(result.fraudReason).toContain('Aynı şasi numaralı başka bir aktif ilan mevcut (VIN clone)');
  });
  
  it('should add fraud score for damage mismatch (high damage but 0 tramer)', () => {
    const inputObj = { 
      ...mockBaseInput,
      price: 1_200_001,
      tramerAmount: 0,
       // Damage object with 3 changed / painted
      damageStatusJson: { 
        MotorKaputu: "boyali",
        SagOnKapi: "degisen",
        SagArkaKapi: "lokal_boyali",
      }
    };

    const result = calculateFraudScore(inputObj as any, []) as any;
    
    expect(result.fraudScore).toBeGreaterThanOrEqual(20);
    expect(result.fraudReason).toContain('Çoklu boya/değişen kaydına rağmen hasar kaydı 0');
  });
});
