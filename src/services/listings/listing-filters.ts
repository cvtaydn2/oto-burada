import type { BrandCatalogItem, CityOption } from "@/data";
import type { Listing, ListingFilters, ListingSortOption } from "@/types";

function normalizeText(value: string) {
  return value.toLocaleLowerCase("tr-TR");
}

export function getModelsForBrand(
  catalog: BrandCatalogItem[],
  brand?: string,
) {
  if (!brand) {
    return [];
  }

  return catalog.find((item) => item.brand === brand)?.models ?? [];
}

export function getDistrictsForCity(
  cities: CityOption[],
  city?: string,
) {
  if (!city) {
    return [];
  }

  return cities.find((item) => item.city === city)?.districts ?? [];
}

export function filterListings(
  listings: Listing[],
  filters: ListingFilters,
) {
  const query = filters.query ? normalizeText(filters.query) : undefined;

  return listings.filter((listing) => {
    if (query) {
      const searchTarget = normalizeText(
        [
          listing.title,
          listing.brand,
          listing.model,
          listing.city,
          listing.district,
        ].join(" "),
      );

      if (!searchTarget.includes(query)) {
        return false;
      }
    }

    if (filters.brand && listing.brand !== filters.brand) {
      return false;
    }

    if (filters.model && listing.model !== filters.model) {
      return false;
    }

    if (filters.city && listing.city !== filters.city) {
      return false;
    }

    if (filters.district && listing.district !== filters.district) {
      return false;
    }

    if (filters.fuelType && listing.fuelType !== filters.fuelType) {
      return false;
    }

    if (filters.transmission && listing.transmission !== filters.transmission) {
      return false;
    }

    if (filters.minPrice !== undefined && listing.price < filters.minPrice) {
      return false;
    }

    if (filters.maxPrice !== undefined && listing.price > filters.maxPrice) {
      return false;
    }

    if (filters.minYear !== undefined && listing.year < filters.minYear) {
      return false;
    }

    if (filters.maxYear !== undefined && listing.year > filters.maxYear) {
      return false;
    }

    if (filters.maxMileage !== undefined && listing.mileage > filters.maxMileage) {
      return false;
    }

    return true;
  });
}

export function sortListings(
  listings: Listing[],
  sort: ListingSortOption = "newest",
) {
  const sorted = [...listings];

  sorted.sort((left, right) => {
    switch (sort) {
      case "price_asc":
        return left.price - right.price;
      case "price_desc":
        return right.price - left.price;
      case "mileage_asc":
        return left.mileage - right.mileage;
      case "year_desc":
        return right.year - left.year;
      case "newest":
      default:
        return Date.parse(right.createdAt) - Date.parse(left.createdAt);
    }
  });

  return sorted;
}
