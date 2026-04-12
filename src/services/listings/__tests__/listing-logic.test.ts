import { describe, it, expect } from "vitest";
import { buildListingSlug, calculateFraudScore } from "../listing-submissions";
import { Listing, ListingCreateInput } from "@/types";

describe("Listing Submission Helpers", () => {
  describe("buildListingSlug", () => {
    const mockInput: ListingCreateInput = {
      title: "Tertemiz Aile Arabası",
      brand: "Volkswagen",
      model: "Golf",
      year: 2022,
      price: 1200000,
      mileage: 15000,
      city: "İstanbul",
      district: "Kadıköy",
      description: "Hatasız boyasız.",
      fuelType: "benzin",
      transmission: "otomatik",
      images: [],
      whatsappPhone: "905550001122",
      vin: "ABC12345678901234"
    };

    it("should generate a clean slug from vehicle info and title", () => {
      const slug = buildListingSlug(mockInput, []);
      expect(slug).toBe("2022-volkswagen-golf-tertemiz-aile-arabasi");
    });

    it("should handle Turkish characters correctly", () => {
      const inputWithTurkishValues: ListingCreateInput = {
        ...mockInput,
        title: "Şahane Ömürlük Çile"
      };
      const slug = buildListingSlug(inputWithTurkishValues, []);
      expect(slug).toBe("2022-volkswagen-golf-sahane-omurluk-cile");
    });

    it("should add a numeric suffix if slug already exists", () => {
      const existing: Listing[] = [
        { slug: "2022-volkswagen-golf-tertemiz-aile-arabasi" } as Listing
      ];
      const slug = buildListingSlug(mockInput, existing);
      expect(slug).toBe("2022-volkswagen-golf-tertemiz-aile-arabasi-2");
    });
  });

  describe("calculateFraudScore", () => {
    const mockInput: ListingCreateInput = {
      brand: "BMW",
      model: "320i",
      year: 2020,
      price: 1500000,
      mileage: 50000,
      vin: "VIN12345678901234",
      title: "BMW 320i",
      city: "İstanbul",
      district: "Beşiktaş",
      description: "Test description.",
      fuelType: "benzin",
      transmission: "otomatik",
      whatsappPhone: "905551112233",
      images: []
    };

    it("should return score 0 for a unique listing", () => {
      const result = calculateFraudScore(mockInput, []);
      expect(result.fraudScore).toBe(0);
      expect(result.fraudReason).toBeNull();
    });

    it("should return high score (100) for duplicate VIN", () => {
      const existing: Listing[] = [
        { vin: "VIN12345678901234", sellerId: "other-user", status: "approved" } as Listing
      ];
      const result = calculateFraudScore(mockInput, existing);
      expect(result.fraudScore).toBe(100);
      expect(result.fraudReason).toContain("VIN clone");
    });

    it("should return moderate score (50) for exact duplicate (brand, model, price, etc.)", () => {
        const existing: Listing[] = [
            { 
                brand: "BMW", model: "320i", year: 2020, price: 1500000, mileage: 50000, 
                sellerId: "other-user" 
            } as Listing
        ];
        const result = calculateFraudScore(mockInput, existing);
        expect(result.fraudScore).toBe(50);
        expect(result.fraudReason).toContain("Mükerrer ilan");
    });

    it("should detect suspicious low price for new cars", () => {
      const cheapNewCar: ListingCreateInput = {
        ...mockInput,
        year: 2023,
        price: 200000 // 200k for 2023 BMW is too low
      };
      const result = calculateFraudScore(cheapNewCar, []);
      expect(result.fraudScore).toBe(60);
      expect(result.fraudReason).toContain("şüpheli fiyat");
    });

    it("should detect damage vs tramer discrepancy", () => {
      const discrepancyInput: ListingCreateInput = {
        ...mockInput,
        tramerAmount: 0,
        damageStatusJson: {
          part1: "boyali",
          part2: "degisen",
          part3: "boyali"
        }
      };
      const result = calculateFraudScore(discrepancyInput, []);
      expect(result.fraudScore).toBe(20);
      expect(result.fraudReason).toContain("hasar kaydı 0");
    });
  });
});
