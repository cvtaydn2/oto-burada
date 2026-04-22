import { describe, expect, it } from "vitest";

import { Listing, ListingCreateInput } from "@/types";

import {
  buildListingRecord,
  buildListingSlug,
  buildUpdatedListing,
  calculateFraudScore,
} from "../listing-submissions";

describe("listing-submissions logic", () => {
  const mockInput: ListingCreateInput = {
    title: "Clean Car",
    brand: "BMW",
    model: "320i",
    year: 2020,
    mileage: 50000,
    fuelType: "benzin",
    transmission: "otomatik",
    price: 1500000,
    city: "İstanbul",
    district: "Beşiktaş",
    description: "Very clean car",
    whatsappPhone: "905551234567",
    vin: "WBA12345678901234",
    images: [],
  };

  describe("calculateFraudScore", () => {
    it("should return 0 for a clean listing", () => {
      const result = calculateFraudScore(mockInput, []);
      expect(result.fraudScore).toBe(0);
      expect(result.fraudReason).toBeNull();
    });

    it("should detect duplicate listings", () => {
      const existingListing = {
        ...mockInput,
        id: "1",
        sellerId: "other-seller",
        vin: "OTHER-VIN-12345678", // Different VIN
        slug: "old",
        createdAt: "",
        updatedAt: "",
        status: "approved",
      } as Listing;
      const result = calculateFraudScore(mockInput, [existingListing]);
      expect(result.fraudScore).toBe(50);
      expect(result.fraudReason).toContain("Mükerrer ilan şüphesi");
    });

    it("should detect VIN cloning", () => {
      const existingListing = {
        ...mockInput,
        id: "1",
        sellerId: "other-seller",
        vin: mockInput.vin,
        slug: "old",
        createdAt: "",
        updatedAt: "",
        status: "approved",
      } as Listing;
      const result = calculateFraudScore(mockInput, [existingListing]);
      expect(result.fraudScore).toBe(100);
      expect(result.fraudReason).toContain("VIN clone");
    });

    it("should flag suspicious low price for new cars", () => {
      const cheapInput = { ...mockInput, year: 2024, price: 150000 };
      const result = calculateFraudScore(cheapInput, []);
      expect(result.fraudScore).toBe(60);
      expect(result.fraudReason).toContain("şüpheli fiyat");
    });

    it("should flag many damage parts with zero tramer", () => {
      const suspiciousDamageInput = {
        ...mockInput,
        tramerAmount: 0,
        damageStatusJson: { kaput: "degisen", tavan: "boyali", bagaj: "degisen" },
      };
      const result = calculateFraudScore(suspiciousDamageInput, []);
      expect(result.fraudScore).toBe(20);
      expect(result.fraudReason).toContain("hasar kaydı 0");
    });
  });

  describe("buildListingSlug", () => {
    it("should generate a simple slug", () => {
      const slug = buildListingSlug(mockInput, []);
      expect(slug).toBe("bmw-320i-2020-istanbul-clean-car");
    });

    it("should handle Turkish characters", () => {
      const turkishInput = { ...mockInput, title: "Çok Özel Şahane Araç" };
      const slug = buildListingSlug(turkishInput, []);
      expect(slug).toBe("bmw-320i-2020-istanbul-cok-ozel-sahane-arac");
    });

    it("should avoid collisions by adding suffixes", () => {
      const existing = { slug: "bmw-320i-2020-istanbul-clean-car" } as Listing;
      const slug = buildListingSlug(mockInput, [existing]);
      expect(slug).toBe("bmw-320i-2020-istanbul-clean-car-2");
    });
  });

  describe("listing mapping semantics", () => {
    it("should persist licensePlate into the built listing record", () => {
      const listing = buildListingRecord(
        { ...mockInput, licensePlate: "34ABC123" },
        "seller-1",
        []
      );

      expect(listing.licensePlate).toBe("34ABC123");
    });

    it("should send approved listings back to pending after edit", () => {
      const existingListing = {
        ...buildListingRecord(mockInput, "seller-1", []),
        status: "approved" as const,
      };

      const updatedListing = buildUpdatedListing(
        { ...mockInput, price: 1550000, licensePlate: "34ABC123" },
        existingListing,
        [{ id: existingListing.id, slug: existingListing.slug }]
      );

      expect(updatedListing.status).toBe("pending");
      expect(updatedListing.licensePlate).toBe("34ABC123");
    });
  });
});
