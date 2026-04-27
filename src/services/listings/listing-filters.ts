import { logger } from "@/lib/logging/logger";
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

export const DEFAULT_LISTING_FILTERS: ListingFilters = {
  sort: "newest",
  page: 1,
  limit: 12,
};

export function parseListingFiltersFromSearchParams(
  searchParams?: Record<string, string | string[] | undefined>
): ListingFilters {
  // ── PERFORMANCE FIX: Issue #17 - Conditional Performance Logging ─────
  // Performance logging only in development to avoid overhead in production.
  // In high-traffic marketplace APIs, Date.now() + logger calls add unnecessary latency.
  const shouldLogPerf = process.env.NODE_ENV === "development";
  const start = shouldLogPerf ? Date.now() : 0;

  const normalizedSearchParams = Object.fromEntries(
    Object.entries(searchParams ?? {}).flatMap(([key, value]) => {
      const firstValue = Array.isArray(value) ? value[0] : value;
      return firstValue !== undefined ? [[key, firstValue]] : [];
    })
  );

  const parsed = listingFiltersSchema.safeParse(normalizedSearchParams);

  if (!parsed.success) {
    const errorMessages = parsed.error.issues.map((i) => i.message).join(", ");
    logger.listings.warn("Invalid search params, using safe defaults", {
      errors: parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
      keys: Object.keys(normalizedSearchParams),
    });

    return {
      ...DEFAULT_LISTING_FILTERS,
      validationError: `Geçersiz filtre parametreleri: ${errorMessages}`,
    };
  }

  if (shouldLogPerf) {
    logger.perf.debug("parseListingFiltersFromSearchParams execution", {
      duration: Date.now() - start,
      success: true,
    });
  }

  // Apply defaults to parsed data
  return {
    ...DEFAULT_LISTING_FILTERS,
    ...parsed.data,
  };
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
