import { describe, it, expect } from "vitest";
import type { ListingFilters } from "@/types";
import {
  normalizeSavedSearchFilters,
  hasMeaningfulSavedSearchFilters,
  getSavedSearchSignature,
  buildSavedSearchTitle,
  buildSavedSearchSummary,
} from "../saved-search-utils";

describe("Saved Search Utils Service", () => {
  describe("normalizeSavedSearchFilters", () => {
    it("should normalize filters correctly", () => {
      const filters: ListingFilters = {
        query: "bmw",
        brand: "BMW",
        carTrim: "M Sport",
        city: "Istanbul",
        minPrice: 500000,
        maxPrice: 2000000,
        maxTramer: 25000,
        hasExpertReport: true,
      };

      const result = normalizeSavedSearchFilters(filters);
      expect(result.brand).toBe("BMW");
      expect(result.carTrim).toBe("M Sport");
      expect(result.city).toBe("Istanbul");
      expect(result.minPrice).toBe(500000);
      expect(result.maxPrice).toBe(2000000);
      expect(result.maxTramer).toBe(25000);
      expect(result.hasExpertReport).toBe(true);
    });
  });

  describe("hasMeaningfulSavedSearchFilters", () => {
    it("should return true for filters with brand", () => {
      const filters: ListingFilters = { brand: "BMW" };
      expect(hasMeaningfulSavedSearchFilters(filters)).toBe(true);
    });

    it("should return true for filters with city", () => {
      const filters: ListingFilters = { city: "Istanbul" };
      expect(hasMeaningfulSavedSearchFilters(filters)).toBe(true);
    });

    it("should return true for filters with price range", () => {
      const filters: ListingFilters = { minPrice: 500000, maxPrice: 1000000 };
      expect(hasMeaningfulSavedSearchFilters(filters)).toBe(true);
    });

    it("should return true for expert and tramer filters", () => {
      expect(hasMeaningfulSavedSearchFilters({ hasExpertReport: true })).toBe(true);
      expect(hasMeaningfulSavedSearchFilters({ maxTramer: 0 })).toBe(true);
    });

    it("should return false for empty filters", () => {
      const filters: ListingFilters = {};
      expect(hasMeaningfulSavedSearchFilters(filters)).toBe(false);
    });

    it("should return false for pagination-only filters", () => {
      const filters: ListingFilters = { page: 2, limit: 20 };
      expect(hasMeaningfulSavedSearchFilters(filters)).toBe(false);
    });
  });

  describe("getSavedSearchSignature", () => {
    it("should generate signature for brand filter", () => {
      const filters: ListingFilters = { brand: "BMW" };
      const signature = getSavedSearchSignature(filters);
      expect(signature).toContain("brand=BMW");
    });

    it("should generate signature for multiple filters", () => {
      const filters: ListingFilters = { brand: "BMW", carTrim: "M Sport", city: "Istanbul", minPrice: 500000, hasExpertReport: true };
      const signature = getSavedSearchSignature(filters);
      expect(signature).toContain("brand=BMW");
      expect(signature).toContain("carTrim=M+Sport");
      expect(signature).toContain("city=Istanbul");
      expect(signature).toContain("minPrice=500000");
      expect(signature).toContain("hasExpertReport=true");
    });
  });

  describe("buildSavedSearchTitle", () => {
    it("should build title with brand and model", () => {
      const filters: ListingFilters = { brand: "BMW", model: "320i" };
      const title = buildSavedSearchTitle(filters);
      expect(title).toBe("BMW 320i");
    });

    it("should include trim in title when present", () => {
      const filters: ListingFilters = { brand: "BMW", model: "320i", carTrim: "M Sport" };
      const title = buildSavedSearchTitle(filters);
      expect(title).toBe("BMW 320i M Sport");
    });

    it("should build title with brand, model and city", () => {
      const filters: ListingFilters = { brand: "BMW", model: "320i", city: "Istanbul" };
      const title = buildSavedSearchTitle(filters);
      expect(title).toContain("BMW");
      expect(title).toContain("Istanbul");
    });

    it("should build title with max price when no other filters", () => {
      const filters: ListingFilters = { maxPrice: 1000000 };
      const title = buildSavedSearchTitle(filters);
      expect(title).toContain("1.000.000");
    });

    it("should use default title when no meaningful filters", () => {
      const filters: ListingFilters = {};
      const title = buildSavedSearchTitle(filters);
      expect(title).toBe("Kayitli arac aramasi");
    });

    it("should truncate long titles", () => {
      const filters: ListingFilters = { 
        brand: "Very Long Brand Name", 
        model: "Very Long Model Name That Is Too Long",
        city: "Very Long City Name"
      };
      const title = buildSavedSearchTitle(filters);
      expect(title.length).toBeLessThanOrEqual(120);
    });
  });

  describe("buildSavedSearchSummary", () => {
    it("should build summary with brand and model", () => {
      const filters: ListingFilters = { brand: "BMW", model: "320i" };
      const summary = buildSavedSearchSummary(filters);
      expect(summary).toContain("BMW 320i");
    });

    it("should build summary with city and district", () => {
      const filters: ListingFilters = { city: "Istanbul", district: "Kadikoy" };
      const summary = buildSavedSearchSummary(filters);
      expect(summary).toContain("Istanbul");
      expect(summary).toContain("Kadikoy");
    });

    it("should build summary with year range", () => {
      const filters: ListingFilters = { minYear: 2020, maxYear: 2023 };
      const summary = buildSavedSearchSummary(filters);
      expect(summary).toContain("Model");
    });

    it("should build summary with fuel type", () => {
      const filters: ListingFilters = { fuelType: "benzin" };
      const summary = buildSavedSearchSummary(filters);
      expect(summary).toContain("benzin");
    });

    it("should build summary with tramer and expert filters", () => {
      const filters: ListingFilters = { maxTramer: 25000, hasExpertReport: true };
      const summary = buildSavedSearchSummary(filters);
      expect(summary).toContain("25.000");
      expect(summary).toContain("Ekspertizli");
    });

    it("should return default summary for empty filters", () => {
      const filters: ListingFilters = {};
      const summary = buildSavedSearchSummary(filters);
      expect(summary).toBe("Tum onayli arac ilanlari");
    });
  });
});
