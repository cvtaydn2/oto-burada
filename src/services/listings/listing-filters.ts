import { logger } from "@/lib/utils/logger";
import { listingFiltersSchema } from "@/lib/validators";
import type { BrandCatalogItem, CityOption, ListingFilters } from "@/types";

export function getModelsForBrand(catalog: BrandCatalogItem[], brand?: string) {
  if (!brand) {
    return [];
  }

  return catalog.find((item) => item.brand === brand)?.models ?? [];
}

export function getDistrictsForCity(cities: CityOption[], city?: string) {
  if (!city) {
    return [];
  }

  return cities.find((item) => item.city === city)?.districts ?? [];
}

export function parseListingFiltersFromSearchParams(
  searchParams?: Record<string, string | string[] | undefined>
) {
  const start = Date.now();
  const normalizedSearchParams = Object.fromEntries(
    Object.entries(searchParams ?? {}).flatMap(([key, value]) => {
      const firstValue = Array.isArray(value) ? value[0] : value;
      return firstValue !== undefined ? [[key, firstValue]] : [];
    })
  );

  const parsed = listingFiltersSchema.safeParse(normalizedSearchParams);

  // If initial parse fails, we attempt a 'lossy' recovery by removing invalid keys
  // This is safer than a hardcoded 'recovered' object because it still respects schema types
  const rawResult = parsed.success
    ? parsed.data
    : (() => {
        const validData = { ...normalizedSearchParams };
        parsed.error.issues.forEach((issue) => {
          const field = issue.path[0];
          if (typeof field === "string") {
            delete (validData as Record<string, unknown>)[field];
          }
        });

        logger.listings.warn("Recovering from corrupted search params", {
          original: normalizedSearchParams,
          errors: parsed.error.issues.length,
        });

        const recovered = listingFiltersSchema.safeParse(validData);
        return recovered.success ? recovered.data : {};
      })();

  logger.perf.debug("parseListingFiltersFromSearchParams execution", {
    duration: Date.now() - start,
    recovered: !parsed.success,
  });

  // Canonicalization & Defaults
  const result = {
    ...rawResult,
    sort: (rawResult as Record<string, unknown>).sort ?? "newest",
    page: rawResult.page && rawResult.page > 0 ? rawResult.page : 1,
    limit: rawResult.limit && rawResult.limit > 0 ? rawResult.limit : 12,
  } as ListingFilters;

  return result;
}

export function createSearchParamsFromListingFilters(filters: ListingFilters) {
  const searchParams = new URLSearchParams();

  const append = (key: string, value: string | number | undefined) => {
    if (value === undefined || value === "" || Number.isNaN(value)) {
      return;
    }

    searchParams.set(key, String(value));
  };

  append("query", filters.query);
  append("brand", filters.brand);
  append("model", filters.model);
  append("carTrim", filters.carTrim);
  append("city", filters.city);
  // citySlug is an internal routing field — do not serialize to search params
  append("district", filters.district);
  append("category", filters.category);
  append("minPrice", filters.minPrice);
  append("maxPrice", filters.maxPrice);
  append("minYear", filters.minYear);
  append("maxYear", filters.maxYear);
  append("maxMileage", filters.maxMileage);
  append("maxTramer", filters.maxTramer);
  append("fuelType", filters.fuelType);
  append("transmission", filters.transmission);
  // Only include page when > 1 — page=1 is the default and adds URL noise
  if (filters.page !== undefined && filters.page > 1) {
    append("page", filters.page);
  }
  append("limit", filters.limit);

  if (filters.hasExpertReport) {
    searchParams.set("hasExpertReport", "true");
  }

  if (filters.sort && filters.sort !== "newest") {
    append("sort", filters.sort);
  }

  return searchParams;
}
