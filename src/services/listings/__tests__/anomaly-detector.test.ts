import { calculateFraudScore } from '../listing-submissions';
import { ListingCreateInput, Listing } from '@/types';

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
    tramerAmount: null as number | null,
    damageStatusJson: null as Record<string, string> | null,
    vin: null as string | null,
  };

  const existingListingsBase = [
    { id: '1', slug: 'l-1', brand: 'Audi', model: 'A3', year: 2022, price: 1_150_000, mileage: 40000 },
    { id: '2', slug: 'l-2', brand: 'Audi', model: 'A3', year: 2022, price: 1_250_000, mileage: 50000 },
    { id: '3', slug: 'l-3', brand: 'Audi', model: 'A3', year: 2022, price: 1_200_000, mileage: 45000 },
  ];

  it('should return 0 fraud score and no flagged status for normal listings', () => {
    const input = { ...mockBaseInput, price: 1_200_001 } as ListingCreateInput;
    const result = calculateFraudScore(input, existingListingsBase as unknown as Listing[]);
    expect(result.fraudScore).toBe(0);
    expect(result.fraudReason).toBeNull();
    expect(result.suggestedStatus).toBeUndefined();
  });

  it('should flag listing when price is 30% below market average', () => {
    const input = { ...mockBaseInput, price: 800_000 } as ListingCreateInput;
    const result = calculateFraudScore(input, existingListingsBase as unknown as Listing[]);
    
    expect(result.fraudScore).toBeGreaterThanOrEqual(70);
    expect(result.fraudReason).toContain('Fiyat ortalamanın %30 altında');
    expect(result.suggestedStatus).toBe('flagged');
  });

  it('should flag listing when price is 50% above market average', () => {
    const input = { ...mockBaseInput, price: 1_900_000 } as ListingCreateInput;
    const result = calculateFraudScore(input, existingListingsBase as unknown as Listing[]);
    
    expect(result.fraudScore).toBeGreaterThanOrEqual(50);
    expect(result.fraudReason).toContain('Fiyat ortalamanın %50 üzerinde');
    expect(result.suggestedStatus).toBe('flagged');
  });

  it('should use fallback price check when less than 3 comparable cars exist', () => {
    const input = { ...mockBaseInput, year: 2023, price: 600_000 } as ListingCreateInput;
    const result = calculateFraudScore(input, []);
    
    expect(result.fraudScore).toBeGreaterThanOrEqual(60);
    expect(result.fraudReason).toContain('Pazar ortalamasının çok altında şüpheli fiyat');
  });

  it('should flag mileage_anomaly for old vehicle with unrealistic low mileage', () => {
    const currentYear = new Date().getFullYear();
    const input = { ...mockBaseInput, year: currentYear - 11, mileage: 5000, price: 1_200_001 } as ListingCreateInput;
    const result = calculateFraudScore(input, []);
    
    expect(result.fraudScore).toBeGreaterThanOrEqual(40);
    expect(result.fraudReason).toContain('mileage_anomaly');
    expect(result.suggestedStatus).toBe('flagged');
  });

  it('should flag duplicate listing (spam detection)', () => {
    const duplicateInput = { ...mockBaseInput } as ListingCreateInput; 
    const result = calculateFraudScore(duplicateInput, existingListingsBase as unknown as Listing[]);
    
    expect(result.fraudScore).toBeGreaterThanOrEqual(50);
    expect(result.fraudReason).toContain('Mükerrer ilan şüphesi');
  });

  it('should flag VIN cloning attempts', () => {
    const inputWithVin = { ...mockBaseInput, vin: 'ABCDEF123456', price: 1_200_001 };
    const existingWithVin = [
      ...existingListingsBase,
      { id: '10', slug: 'l-10', vin: 'ABCDEF123456', status: 'approved' },
    ];
    
    const result = calculateFraudScore(inputWithVin as ListingCreateInput, existingWithVin as unknown as Listing[]);
    
    expect(result.fraudScore).toBeGreaterThanOrEqual(100);
    expect(result.fraudReason).toContain('Aynı şasi numaralı başka bir aktif ilan mevcut (VIN clone)');
  });
  
  it('should add fraud score for damage mismatch (high damage but 0 tramer)', () => {
    const inputObj = { 
      ...mockBaseInput,
      price: 1_200_001,
      tramerAmount: 0,
      damageStatusJson: { 
        MotorKaputu: "boyali",
        SagOnKapi: "degisen",
        SagArkaKapi: "lokal_boyali",
      }
    };

    const result = calculateFraudScore(inputObj as ListingCreateInput, []);
    
    expect(result.fraudScore).toBeGreaterThanOrEqual(20);
    expect(result.fraudReason).toContain('Çoklu boya/değişen kaydına rağmen hasar kaydı 0');
  });
});
