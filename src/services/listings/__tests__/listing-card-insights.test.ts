import { describe, it, expect } from "vitest";
import { getListingCardInsights } from "../listing-card-insights";
import type { Listing } from "@/types";

describe("Listing Card Insights Service", () => {
  const createMockListing = (overrides: Partial<Listing> = {}): Listing => ({
    id: "1",
    slug: "test-listing",
    sellerId: "seller-1",
    title: "Test Car",
    brand: "BMW",
    model: "320i",
    year: 2023,
    mileage: 50000,
    fuelType: "benzin",
    transmission: "otomatik",
    price: 1500000,
    city: "Istanbul",
    district: "Kadikoy",
    description: "Test description",
    whatsappPhone: "+905551234567",
    status: "approved",
    viewCount: 100,
    featured: false,
    images: [],
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    ...overrides
  });

  it("should return 'Akilli Secim' for budget-friendly low mileage listing", () => {
    const listing = createMockListing({ price: 800000, mileage: 50000 });
    const insights = getListingCardInsights(listing);
    
    expect(insights.badgeLabel).toBe("Akilli Secim");
    expect(insights.tone).toBe("emerald");
  });

  it("should return 'Kolay Karar' for easy drive newer model", () => {
    const listing = createMockListing({ 
      transmission: "otomatik", 
      year: 2022,
      price: 2000000
    });
    const insights = getListingCardInsights(listing);
    
    expect(insights.badgeLabel).toBe("Kolay Karar");
    expect(insights.tone).toBe("indigo");
  });

  it("should return 'One Cikan' for featured listing", () => {
    const listing = createMockListing({ 
      featured: true,
      price: 2000000,
      mileage: 100000,
      transmission: "manuel",
      year: 2015
    });
    const insights = getListingCardInsights(listing);
    
    expect(insights.badgeLabel).toBe("One Cikan");
    expect(insights.tone).toBe("amber");
  });

  it("should return default insight for regular listing", () => {
    const listing = createMockListing({ 
      price: 2000000, 
      mileage: 150000,
      year: 2015,
      featured: false
    });
    const insights = getListingCardInsights(listing);
    
    expect(insights.badgeLabel).toBe("Incelenebilir");
    expect(insights.tone).toBe("indigo");
  });

  it("should include correct highlights for budget-friendly listing", () => {
    const listing = createMockListing({ price: 500000, mileage: 30000, year: 2024 });
    const insights = getListingCardInsights(listing);
    
    expect(insights.highlights).toContain("Butce Dostu");
    expect(insights.highlights).toContain("Dusuk KM");
    expect(insights.highlights).toContain("Guncel Model");
  });

  it("should include correct highlights for easy drive listing", () => {
    const listing = createMockListing({ 
      transmission: "otomatik", 
      year: 2023,
      mileage: 100000
    });
    const insights = getListingCardInsights(listing);
    
    expect(insights.highlights).toContain("Otomatik Surus");
    expect(insights.highlights).toContain("Guncel Model");
  });
});