import {} from "@/lib";
import { logger } from "@/lib/logger";
import { listingFiltersSchema } from "@/lib/validators/marketplace";
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

const FILTER_KEYS = [
  "query",
  "brand",
  "model",
  "carTrim",
  "city",
  "citySlug",
  "district",
  "category",
  "minPrice",
  "maxPrice",
  "minYear",
  "maxYear",
  "maxMileage",
  "maxTramer",
  "hasExpertReport",
  "fuelType",
  "transmission",
  "sort",
  "page",
  "limit",
  "sellerId",
  "cursor",
] as const satisfies ReadonlyArray<keyof ListingFilters>;

function normalizeSearchParams(searchParams?: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(searchParams ?? {}).flatMap(([key, value]) => {
      const firstValue = Array.isArray(value) ? value[0] : value;
      return firstValue !== undefined ? [[key, firstValue]] : [];
    })
  );
}

function parseFiltersWithRecovery(normalizedSearchParams: Record<string, string>) {
  const parsed = listingFiltersSchema.safeParse(normalizedSearchParams);

  if (parsed.success) {
    return {
      data: parsed.data,
      droppedKeys: [] as string[],
      errorMessages: [] as string[],
    };
  }

  const recoveredEntries = FILTER_KEYS.flatMap((key) => {
    const value = normalizedSearchParams[key];
    if (value === undefined) {
      return [];
    }

    const singleParse = listingFiltersSchema.safeParse({ [key]: value });
    return singleParse.success ? [[key, value] as const] : [];
  });

  const recovered = listingFiltersSchema.safeParse(Object.fromEntries(recoveredEntries));
  const droppedKeys = Array.from(
    new Set(parsed.error.issues.flatMap((issue) => issue.path.map((segment) => String(segment))))
  );

  return {
    data: recovered.success ? recovered.data : {},
    droppedKeys,
    errorMessages: parsed.error.issues.map((issue) => issue.message),
  };
}

export function parseListingFiltersFromSearchParams(
  searchParams?: Record<string, string | string[] | undefined>
): ListingFilters {
  const shouldLogPerf = process.env.NODE_ENV === "development";
  const start = shouldLogPerf ? Date.now() : 0;
  const normalizedSearchParams = normalizeSearchParams(searchParams);

  const { data, droppedKeys, errorMessages } = parseFiltersWithRecovery(normalizedSearchParams);

  if (droppedKeys.length > 0) {
    logger.listings.warn("Invalid search params detected, dropping invalid filters", {
      errors: errorMessages,
      droppedKeys,
      keys: Object.keys(normalizedSearchParams),
    });
  }

  if (shouldLogPerf) {
    logger.perf.debug("parseListingFiltersFromSearchParams execution", {
      duration: Date.now() - start,
      success: true,
      droppedKeys,
    });
  }

  return {
    ...DEFAULT_LISTING_FILTERS,
    ...data,
    limit: data.limit ?? DEFAULT_LISTING_FILTERS.limit,
    page: data.page ?? DEFAULT_LISTING_FILTERS.page,
    sort: data.sort ?? DEFAULT_LISTING_FILTERS.sort,
    ...(errorMessages.length > 0
      ? {
          validationError: `Geçersiz filtre parametreleri: ${errorMessages.join(", ")}`,
        }
      : {}),
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

  if (filters.page !== undefined && filters.page > 1) {
    append("page", filters.page);
  }

  if (filters.limit !== undefined && filters.limit !== DEFAULT_LISTING_FILTERS.limit) {
    append("limit", filters.limit);
  }

  if (filters.hasExpertReport) {
    searchParams.set("hasExpertReport", "true");
  }

  if (filters.sort && filters.sort !== "newest") {
    append("sort", filters.sort);
  }

  return searchParams;
}
