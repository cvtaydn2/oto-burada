import { listingFiltersSchema } from "@/lib/validators";
import { createSearchParamsFromListingFilters } from "@/services/listings/listing-filters";
import type { ListingFilters } from "@/types";

type NormalizedSavedSearchFilters = Omit<ListingFilters, "limit" | "page">;

export function normalizeSavedSearchFilters(filters: ListingFilters): NormalizedSavedSearchFilters {
  const parsedResult = listingFiltersSchema.safeParse(filters);
  const parsed = parsedResult.success
    ? parsedResult.data
    : {
        ...filters,
        sort: filters.sort ?? "newest",
      };

  return {
    query: parsed.query,
    brand: parsed.brand,
    model: parsed.model,
    carTrim: parsed.carTrim,
    city: parsed.city,
    district: parsed.district,
    minPrice: parsed.minPrice,
    maxPrice: parsed.maxPrice,
    minYear: parsed.minYear,
    maxYear: parsed.maxYear,
    maxMileage: parsed.maxMileage,
    maxTramer: parsed.maxTramer,
    hasExpertReport: parsed.hasExpertReport,
    fuelType: parsed.fuelType,
    transmission: parsed.transmission,
    sort: parsed.sort ?? "newest",
  };
}

export function hasMeaningfulSavedSearchFilters(filters: ListingFilters) {
  const normalized = normalizeSavedSearchFilters(filters);

  return Boolean(
    normalized.query ||
    normalized.brand ||
    normalized.model ||
    normalized.carTrim ||
    normalized.city ||
    normalized.district ||
    normalized.minPrice !== undefined ||
    normalized.maxPrice !== undefined ||
    normalized.minYear !== undefined ||
    normalized.maxYear !== undefined ||
    normalized.maxMileage !== undefined ||
    normalized.maxTramer !== undefined ||
    normalized.hasExpertReport === true ||
    normalized.fuelType ||
    normalized.transmission
  );
}

export function getSavedSearchSignature(filters: ListingFilters) {
  const normalized = normalizeSavedSearchFilters(filters);
  const searchParams = createSearchParamsFromListingFilters(normalized);

  if (normalized.sort && normalized.sort !== "newest") {
    searchParams.set("sort", normalized.sort);
  }

  return searchParams.toString();
}

export function buildSavedSearchTitle(filters: ListingFilters) {
  const normalized = normalizeSavedSearchFilters(filters);
  const parts = [
    [normalized.brand, normalized.model, normalized.carTrim].filter(Boolean).join(" ").trim(),
    normalized.city,
    normalized.query ? `"${normalized.query}"` : undefined,
  ].filter(Boolean) as string[];

  if (parts.length > 0) {
    return parts.join(" • ").slice(0, 120);
  }

  if (normalized.maxPrice !== undefined) {
    return `Max ${normalized.maxPrice.toLocaleString("tr-TR")} TL`;
  }

  if (normalized.maxMileage !== undefined) {
    return `Max ${normalized.maxMileage.toLocaleString("tr-TR")} km`;
  }

  return "Kayitli arac aramasi";
}

export function buildSavedSearchSummary(filters: ListingFilters) {
  const normalized = normalizeSavedSearchFilters(filters);
  const summaryParts = [
    [normalized.brand, normalized.model, normalized.carTrim].filter(Boolean).join(" ").trim() ||
      undefined,
    normalized.city
      ? `${normalized.city}${normalized.district ? ` / ${normalized.district}` : ""}`
      : undefined,
    normalized.minYear || normalized.maxYear
      ? `Model ${normalized.minYear ?? "eski"}-${normalized.maxYear ?? "guncel"}`
      : undefined,
    normalized.maxPrice !== undefined
      ? `Max ${normalized.maxPrice.toLocaleString("tr-TR")} TL`
      : undefined,
    normalized.maxMileage !== undefined
      ? `Max ${normalized.maxMileage.toLocaleString("tr-TR")} km`
      : undefined,
    normalized.maxTramer !== undefined
      ? `Max ${normalized.maxTramer.toLocaleString("tr-TR")} TL tramer`
      : undefined,
    normalized.hasExpertReport ? "Ekspertizli" : undefined,
    normalized.fuelType,
    normalized.transmission,
    normalized.query ? `"${normalized.query}"` : undefined,
  ].filter(Boolean);

  return summaryParts.length > 0 ? summaryParts.join(" • ") : "Tum onayli arac ilanlari";
}
