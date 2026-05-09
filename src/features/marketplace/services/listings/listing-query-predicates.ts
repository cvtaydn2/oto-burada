import type { Listing, ListingFilters } from "@/types";
import type { Database } from "@/types/supabase";

import type { ListingQuery } from "./listing-query-types";

const VALID_STATUSES = ["draft", "pending", "approved", "rejected", "archived"] as const;
const MAX_PAGE_LIMIT = 100;
const DEFAULT_PAGE_LIMIT = 50;

export function applyListingFilterPredicates(
  query: ListingQuery,
  filters: ListingFilters,
  options?: { legacySchema?: boolean }
): ListingQuery {
  let nextQuery = query;

  if (filters.sellerId) nextQuery = nextQuery.eq("seller_id", filters.sellerId);
  if (filters.brand) nextQuery = nextQuery.eq("brand", filters.brand);
  if (filters.model) nextQuery = nextQuery.eq("model", filters.model);
  if (filters.carTrim) nextQuery = nextQuery.eq("car_trim", filters.carTrim);
  if (filters.city) nextQuery = nextQuery.eq("city", filters.city);
  if (filters.district) nextQuery = nextQuery.eq("district", filters.district);
  if (filters.category && !options?.legacySchema)
    nextQuery = nextQuery.eq(
      "category",
      filters.category as Database["public"]["Enums"]["vehicle_category"]
    );
  if (filters.fuelType)
    nextQuery = nextQuery.eq(
      "fuel_type",
      filters.fuelType as Database["public"]["Enums"]["fuel_type"]
    );
  if (filters.transmission)
    nextQuery = nextQuery.eq(
      "transmission",
      filters.transmission as Database["public"]["Enums"]["transmission_type"]
    );
  if (filters.minPrice !== undefined) nextQuery = nextQuery.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) nextQuery = nextQuery.lte("price", filters.maxPrice);
  if (filters.minYear !== undefined) nextQuery = nextQuery.gte("year", filters.minYear);
  if (filters.maxYear !== undefined) nextQuery = nextQuery.lte("year", filters.maxYear);
  if (filters.maxMileage !== undefined) nextQuery = nextQuery.lte("mileage", filters.maxMileage);

  if (filters.maxTramer !== undefined) {
    nextQuery =
      filters.maxTramer === 0
        ? nextQuery.or("tramer_amount.is.null,tramer_amount.eq.0")
        : nextQuery.lte("tramer_amount", filters.maxTramer);
  }

  if (filters.hasExpertReport === true) {
    nextQuery = nextQuery.contains("expert_inspection", { hasInspection: true });
  }

  // NOTE: 'is_exchange' column is missing in active DB schema. Commented to prevent build and runtime crashes.
  // if (filters.isExchange !== undefined) nextQuery = nextQuery.eq("is_exchange", filters.isExchange);
  if (filters.featured !== undefined) nextQuery = nextQuery.eq("featured", filters.featured);
  if (filters.galleryPriority !== undefined) {
    nextQuery = nextQuery.gte("gallery_priority", filters.galleryPriority);
  }

  if (filters.query) {
    const terms = filters.query.trim().split(/\s+/).filter(Boolean);
    if (terms.length > 0) {
      const tsQuery = terms.map((term) => `${term}:*`).join(" & ");
      nextQuery = nextQuery.textSearch("search_vector", tsQuery, {
        config: "turkish_unaccent",
      });
    }
  }

  return nextQuery;
}

export function sanitizeListingStatuses(statuses?: Listing["status"][]): Listing["status"][] {
  if (!statuses?.length) return [];

  return statuses.filter((status): status is Listing["status"] =>
    VALID_STATUSES.some((validStatus) => validStatus === status)
  );
}

export function sanitizeListingPagination(filters?: Pick<ListingFilters, "page" | "limit">): {
  page: number;
  limit: number;
  from: number;
  to: number;
} {
  const page = Math.max(filters?.page ?? 1, 1);
  const rawLimit = filters?.limit ?? DEFAULT_PAGE_LIMIT;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_PAGE_LIMIT);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { page, limit, from, to };
}
