/**
 * Tests: parseListingFiltersFromSearchParams — invalid query recovery behavior
 * Risk: bozuk query param geldiğinde cursor veya diğer filtreler sessizce kaybolabilir.
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/shared/lib/logger", () => ({
  logger: {
    listings: { warn: vi.fn() },
    perf: { debug: vi.fn() },
  },
}));

import { parseListingFiltersFromSearchParams } from "@/features/marketplace/services/listing-filters";

describe("parseListingFiltersFromSearchParams — invalid query recovery", () => {
  it("returns default filters for empty params", () => {
    const result = parseListingFiltersFromSearchParams({});
    expect(result.sort).toBe("newest");
  });

  it("parses valid params correctly", () => {
    const result = parseListingFiltersFromSearchParams({
      brand: "BMW",
      city: "İstanbul",
      minPrice: "100000",
      sort: "price_asc",
    });

    expect(result.brand).toBe("BMW");
    expect(result.city).toBe("İstanbul");
    expect(result.minPrice).toBe(100000);
    expect(result.sort).toBe("price_asc");
  });

  it("drops invalid minPrice but preserves valid brand and city", () => {
    const result = parseListingFiltersFromSearchParams({
      brand: "Toyota",
      city: "Ankara",
      minPrice: "not-a-number",
    });

    expect(result.brand).toBe("Toyota");
    expect(result.city).toBe("Ankara");
    expect(result.minPrice).toBeUndefined();
    expect(result.validationError).toBeDefined();
  });

  it("drops invalid sort but preserves other valid filters", () => {
    const result = parseListingFiltersFromSearchParams({
      brand: "Honda",
      sort: "random_invalid_sort",
    });

    expect(result.brand).toBe("Honda");
    expect(result.sort).toBe("newest");
  });

  it("drops invalid fuelType but preserves brand", () => {
    const result = parseListingFiltersFromSearchParams({
      brand: "Ford",
      fuelType: "hydrogen",
    });

    expect(result.brand).toBe("Ford");
    expect(result.fuelType).toBeUndefined();
  });

  it("drops invalid transmission but preserves city", () => {
    const result = parseListingFiltersFromSearchParams({
      city: "İzmir",
      transmission: "warp_drive",
    });

    expect(result.city).toBe("İzmir");
    expect(result.transmission).toBeUndefined();
  });

  it("preserves cursor when other params are invalid", () => {
    const result = parseListingFiltersFromSearchParams({
      cursor: "eyJpZCI6IjEyMyJ9",
      minPrice: "abc",
    });

    expect(result.cursor).toBe("eyJpZCI6IjEyMyJ9");
    expect(result.minPrice).toBeUndefined();
  });

  it("preserves page when other params are invalid", () => {
    const result = parseListingFiltersFromSearchParams({
      page: "3",
      maxMileage: "not-a-number",
    });

    expect(result.page).toBe(3);
    expect(result.maxMileage).toBeUndefined();
  });

  it("handles completely invalid params by returning defaults", () => {
    const result = parseListingFiltersFromSearchParams({
      minPrice: "abc",
      maxPrice: "xyz",
      sort: "invalid",
      fuelType: "steam",
    });

    expect(result.sort).toBe("newest");
    expect(result.minPrice).toBeUndefined();
    expect(result.maxPrice).toBeUndefined();
    expect(result.fuelType).toBeUndefined();
  });

  it("handles array values by using first element when schema remains valid", () => {
    const result = parseListingFiltersFromSearchParams({
      brand: ["BMW", "Audi"],
    });

    expect(result.brand).toBe("BMW");
  });

  it("returns safe defaults when empty array produces invalid input", () => {
    const result = parseListingFiltersFromSearchParams({
      brand: [],
      city: "Bursa",
    });

    expect(result.brand).toBeUndefined();
    expect(result.city).toBe("Bursa");
    expect(result.validationError).toBeUndefined();
  });

  it("logs a warning when invalid params are dropped", async () => {
    const { logger } = await import("@/features/shared/lib/logger");

    parseListingFiltersFromSearchParams({
      brand: "BMW",
      minPrice: "invalid",
    });

    expect(logger.listings.warn).toHaveBeenCalledWith(
      expect.stringContaining("Invalid search params detected, dropping invalid filters"),
      expect.any(Object)
    );
  });

  it("does not log warning when all params are valid", async () => {
    const { logger } = await import("@/features/shared/lib/logger");
    vi.mocked(logger.listings.warn).mockClear();

    parseListingFiltersFromSearchParams({
      brand: "BMW",
      city: "İstanbul",
      sort: "price_asc",
    });

    expect(logger.listings.warn).not.toHaveBeenCalled();
  });

  it("handles undefined searchParams gracefully", () => {
    const result = parseListingFiltersFromSearchParams(undefined);
    expect(result.sort).toBe("newest");
  });

  it("preserves hasExpertReport=true when other params are invalid", () => {
    const result = parseListingFiltersFromSearchParams({
      hasExpertReport: "true",
      minPrice: "bad",
    });

    expect(result.hasExpertReport).toBe(true);
    expect(result.minPrice).toBeUndefined();
    expect(result.validationError).toBeDefined();
  });
});
