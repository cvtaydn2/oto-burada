import { getStoredListings } from "@/services/listings/listing-submissions";
import type { BrandCatalogItem, CityOption, Listing, SearchSuggestionItem } from "@/types";

function sortLocale(values: string[]) {
  return [...values].sort((left, right) => left.localeCompare(right, "tr"));
}

function deriveBrandCatalog(listings: Listing[]): BrandCatalogItem[] {
  const brandMap = new Map<string, Set<string>>();

  for (const listing of listings) {
    if (!listing.brand.trim()) {
      continue;
    }

    const models = brandMap.get(listing.brand) ?? new Set<string>();

    if (listing.model.trim()) {
      models.add(listing.model);
    }

    brandMap.set(listing.brand, models);
  }

  return sortLocale([...brandMap.keys()]).map((brand) => ({
    brand,
    models: sortLocale([...(brandMap.get(brand) ?? new Set<string>())]),
  }));
}

function deriveCityOptions(listings: Listing[]): CityOption[] {
  const cityMap = new Map<string, Set<string>>();

  for (const listing of listings) {
    if (!listing.city.trim()) {
      continue;
    }

    const districts = cityMap.get(listing.city) ?? new Set<string>();

    if (listing.district.trim()) {
      districts.add(listing.district);
    }

    cityMap.set(listing.city, districts);
  }

  return sortLocale([...cityMap.keys()]).map((city) => ({
    city,
    cityPlate: null,
    districts: sortLocale([...(cityMap.get(city) ?? new Set<string>())]),
  }));
}

function deriveSearchSuggestions(listings: Listing[]): SearchSuggestionItem[] {
  const uniqueSuggestions = new Map<string, SearchSuggestionItem>();

  for (const listing of listings) {
    if (listing.brand.trim()) {
      uniqueSuggestions.set(`brand:${listing.brand}`, {
        label: listing.brand,
        type: "brand",
        value: listing.brand,
      });
    }

    if (listing.city.trim()) {
      uniqueSuggestions.set(`city:${listing.city}`, {
        label: listing.city,
        type: "city",
        value: listing.city,
      });
    }

    if (listing.brand.trim() && listing.model.trim()) {
      const value = `${listing.brand} ${listing.model}`;
      uniqueSuggestions.set(`model:${value}`, {
        label: value,
        type: "model",
        value,
      });
    }
  }

  return [...uniqueSuggestions.values()]
    .sort((left, right) => left.label.localeCompare(right.label, "tr"))
    .slice(0, 12);
}

export async function getLiveMarketplaceReferenceData() {
  const listings = await getStoredListings();
  const approvedListings = listings.filter((listing) => listing.status === "approved");
  const sourceListings = approvedListings.length > 0 ? approvedListings : listings;

  return {
    brands: deriveBrandCatalog(sourceListings),
    cities: deriveCityOptions(sourceListings),
    searchSuggestions: deriveSearchSuggestions(sourceListings),
  };
}

export function mergeCityOptions(cities: CityOption[], extraCities: string[]) {
  const cityMap = new Map(cities.map((city) => [city.city, city]));

  for (const city of extraCities) {
    if (!city.trim() || cityMap.has(city)) {
      continue;
    }

    cityMap.set(city, {
      city,
      cityPlate: null,
      districts: [],
    });
  }

  return sortLocale([...cityMap.keys()]).map((city) => cityMap.get(city)!);
}
