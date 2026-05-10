import type { BrandCatalogItem, CityOption, ListingFilters } from "@/types";

export type MarketplaceSort = "newest" | "oldest" | "price_asc" | "price_desc";

export interface MarketplaceListingsQuery {
  brand?: string;
  model?: string;
  carTrim?: string;
  city?: string;
  district?: string;
  fuelType?: string;
  transmission?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  maxMileage?: number;
  hasExpertReport?: boolean;
  maxTramer?: number;
  query?: string;
  sort: MarketplaceSort;
  page: number;
  limit: number;
  sellerId?: string;
  cursor?: string;
  isExchange?: boolean;
  featured?: boolean;
  galleryPriority?: number;
}

interface CanonicalizeMarketplaceFiltersOptions {
  brands?: BrandCatalogItem[];
  cities?: CityOption[];
}

interface BuildMarketplaceFilterStateArgs {
  rawFilters: ListingFilters;
  query: MarketplaceListingsQuery;
  brands: BrandCatalogItem[];
  cities: CityOption[];
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const DEFAULT_SORT: MarketplaceSort = "newest";
const ALLOWED_PAGE_SIZES = new Set([12, 24, 48]);

export const DEFAULT_MARKETPLACE_QUERY: MarketplaceListingsQuery = {
  page: DEFAULT_PAGE,
  limit: DEFAULT_LIMIT,
  sort: DEFAULT_SORT,
};

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().replace(/<[^>]*>/g, "");
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) return undefined;

    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return parsed;
  }

  return undefined;
}

function normalizeBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true" || normalized === "1" || normalized === "yes") {
      return true;
    }

    if (normalized === "false" || normalized === "0" || normalized === "no") {
      return false;
    }
  }

  return undefined;
}

function normalizePositiveInt(value: unknown, fallback: number): number {
  const normalized = normalizeNumber(value);
  if (normalized === undefined) return fallback;

  const integer = Math.floor(normalized);
  return integer > 0 ? integer : fallback;
}

function normalizePageSize(value: unknown, fallback: number): number {
  const normalized = normalizePositiveInt(value, fallback);
  return ALLOWED_PAGE_SIZES.has(normalized) ? normalized : fallback;
}

function normalizeSort(value: unknown): MarketplaceSort {
  if (value === "newest" || value === "oldest" || value === "price_asc" || value === "price_desc") {
    return value;
  }

  return DEFAULT_SORT;
}

function resolveBrandName(brands: BrandCatalogItem[] | undefined, value: string | undefined) {
  if (!brands || !value) return value;

  const match = brands.find(
    (brand) =>
      brand.slug.toLowerCase() === value.toLowerCase() ||
      brand.brand.toLowerCase() === value.toLowerCase()
  );

  return match?.brand ?? value;
}

function resolveCityName(cities: CityOption[] | undefined, value: string | undefined) {
  if (!cities || !value) return value;

  const match = cities.find(
    (city) =>
      city.slug.toLowerCase() === value.toLowerCase() ||
      city.city.toLowerCase() === value.toLowerCase()
  );

  return match?.city ?? value;
}

export function canonicalizeMarketplaceFilters(
  filters: ListingFilters,
  options?: CanonicalizeMarketplaceFiltersOptions
): MarketplaceListingsQuery {
  const brand = resolveBrandName(options?.brands, normalizeString(filters.brand));
  const city = resolveCityName(options?.cities, normalizeString(filters.city));

  return {
    brand,
    model: normalizeString(filters.model),
    carTrim: normalizeString(filters.carTrim),
    city,
    district: normalizeString(filters.district),
    fuelType: normalizeString(filters.fuelType),
    transmission: normalizeString(filters.transmission),
    minPrice: normalizeNumber(filters.minPrice),
    maxPrice: normalizeNumber(filters.maxPrice),
    minYear: normalizeNumber(filters.minYear),
    maxYear: normalizeNumber(filters.maxYear),
    maxMileage: normalizeNumber(filters.maxMileage),
    hasExpertReport: normalizeBoolean(filters.hasExpertReport),
    maxTramer: normalizeNumber(filters.maxTramer),
    query: normalizeString(filters.query),
    sort: normalizeSort(filters.sort),
    page: normalizePositiveInt(filters.page, DEFAULT_PAGE),
    limit: normalizePageSize(filters.limit, DEFAULT_LIMIT),
    sellerId: normalizeString(filters.sellerId),
    cursor: normalizeString(filters.cursor),
    isExchange: normalizeBoolean(filters.isExchange),
    featured: normalizeBoolean(filters.featured),
    galleryPriority: normalizeNumber(filters.galleryPriority),
  };
}

export function buildMarketplaceFilterState({
  rawFilters,
  query,
  brands,
  cities,
}: BuildMarketplaceFilterStateArgs): ListingFilters {
  const resolvedBrand = resolveBrandName(brands, normalizeString(rawFilters.brand)) ?? query.brand;
  const resolvedCity = resolveCityName(cities, normalizeString(rawFilters.city)) ?? query.city;

  return {
    ...rawFilters,
    ...query,
    ...(resolvedBrand ? { brand: resolvedBrand } : {}),
    ...(resolvedCity ? { city: resolvedCity } : {}),
    ...(rawFilters.validationError ? { validationError: rawFilters.validationError } : {}),
  };
}

export function buildMarketplaceSearchParams(query: MarketplaceListingsQuery): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }

  return params;
}

export function serializeMarketplaceQuery(query: MarketplaceListingsQuery): string {
  return JSON.stringify(
    Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .sort(([left], [right]) => left.localeCompare(right))
  );
}

export function isSameMarketplaceQuery(
  left: MarketplaceListingsQuery,
  right: MarketplaceListingsQuery
): boolean {
  return serializeMarketplaceQuery(left) === serializeMarketplaceQuery(right);
}

const NON_ACTIVE_FILTER_KEYS = new Set([
  "page",
  "limit",
  "sort",
  "cursor",
  "validationError",
  "citySlug",
]);

export function countActiveMarketplaceFilters(filters: ListingFilters): number {
  let count = 0;

  for (const [key, value] of Object.entries(filters)) {
    if (NON_ACTIVE_FILTER_KEYS.has(key)) continue;
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim().length === 0) continue;
    count += 1;
  }

  return count;
}
