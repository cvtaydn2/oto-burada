import { describe, expect, it } from "vitest";

import type { Listing, ListingFilters } from "@/types";

import { filterListings } from "../listing-filters";

const mockListings: Partial<Listing>[] = [
  {
    id: "1",
    price: 100000,
    mileage: 50000,
    year: 2020,
    createdAt: "2024-01-01T10:00:00Z",
    brand: "BMW",
    status: "approved",
  },
  {
    id: "2",
    price: 200000,
    mileage: 10000,
    year: 2022,
    createdAt: "2024-01-02T10:00:00Z",
    brand: "BMW",
    status: "approved",
  },
  {
    id: "3",
    price: 50000,
    mileage: 100000,
    year: 2018,
    createdAt: "2023-12-31T10:00:00Z",
    brand: "BMW",
    status: "approved",
  },
];

describe("Listing Sorting Logic (Client Side)", () => {
  it("should sort by price_asc", () => {
    const filters: ListingFilters = { sort: "price_asc" };
    const result = filterListings(mockListings as Listing[], filters);
    expect(result[0].id).toBe("3"); // 50k
    expect(result[1].id).toBe("1"); // 100k
    expect(result[2].id).toBe("2"); // 200k
  });

  it("should sort by price_desc", () => {
    const filters: ListingFilters = { sort: "price_desc" };
    const result = filterListings(mockListings as Listing[], filters);
    expect(result[0].id).toBe("2"); // 200k
  });

  it("should sort by mileage_asc", () => {
    const filters: ListingFilters = { sort: "mileage_asc" };
    const result = filterListings(mockListings as Listing[], filters);
    expect(result[0].id).toBe("2"); // 10k km
  });

  it("should sort by mileage_desc (new fix)", () => {
    const filters: ListingFilters = { sort: "mileage_desc" };
    const result = filterListings(mockListings as Listing[], filters);
    expect(result[0].id).toBe("3"); // 100k km
  });

  it("should sort by newest (default)", () => {
    const filters: ListingFilters = { sort: "newest" };
    const result = filterListings(mockListings as Listing[], filters);
    expect(result[0].id).toBe("2"); // Jan 2
  });

  it("should sort by oldest (new fix)", () => {
    const filters: ListingFilters = { sort: "oldest" };
    const result = filterListings(mockListings as Listing[], filters);
    expect(result[0].id).toBe("3"); // Dec 31
  });

  it("should sort by year_asc (new fix)", () => {
    const filters: ListingFilters = { sort: "year_asc" };
    const result = filterListings(mockListings as Listing[], filters);
    expect(result[0].id).toBe("3"); // 2018
  });

  it("should sort by year_desc", () => {
    const filters: ListingFilters = { sort: "year_desc" };
    const result = filterListings(mockListings as Listing[], filters);
    expect(result[0].id).toBe("2"); // 2022
  });
});
