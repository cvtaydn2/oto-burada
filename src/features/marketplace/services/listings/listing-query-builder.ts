import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

import {
  applyListingFilterPredicates,
  sanitizeListingPagination,
  sanitizeListingStatuses,
} from "./listing-query-predicates";
import type { ListingBaseQueryOptions, ListingQuery } from "./listing-query-types";

type ListingSort = NonNullable<NonNullable<ListingBaseQueryOptions["filters"]>["sort"]>;

function getCursorDirection(sort?: ListingSort): "asc" | "desc" {
  switch (sort) {
    case "price_asc":
    case "mileage_asc":
    case "year_asc":
    case "oldest":
      return "asc";
    case "price_desc":
    case "mileage_desc":
    case "year_desc":
    case "newest":
    default:
      return "desc";
  }
}

function formatCursorFilterValue(value: string | number): string {
  if (typeof value === "number") return String(value);

  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function applyLexicographicalCursor(
  query: ListingQuery,
  options?: ListingBaseQueryOptions
): ListingQuery {
  if (!options?.cursor) return query;

  const sort = options.filters?.sort ?? "newest";
  const direction = getCursorDirection(sort);
  const operator = direction === "asc" ? "gt" : "lt";
  const cursorValue = formatCursorFilterValue(options.cursor.value);
  const cursorId = formatCursorFilterValue(options.cursor.id);

  return query.or(
    `${options.cursor.column}.${operator}.${cursorValue},and(${options.cursor.column}.eq.${cursorValue},id.${operator}.${cursorId})`
  ) as ListingQuery;
}

export function buildListingBaseQuery(
  client: SupabaseClient<Database>,
  selectClause: string,
  options?: ListingBaseQueryOptions
): ListingQuery {
  const countOption = options?.countOnly || options?.withCount ? "exact" : undefined;

  let query: ListingQuery = client
    .from("listings")
    .select(
      selectClause,
      countOption ? { count: countOption, head: !!options?.countOnly } : undefined
    ) as unknown as ListingQuery;

  const sellerId = options?.sellerId ?? options?.filters?.sellerId;
  if (sellerId) query = query.eq("seller_id", sellerId);
  if (options?.listingId) query = query.eq("id", options.listingId);
  if (options?.slug) query = query.eq("slug", options.slug);
  if (options?.ids?.length) query = query.in("id", options.ids);

  const sanitizedStatuses = sanitizeListingStatuses(options?.statuses);
  if (sanitizedStatuses.length > 0) {
    query = query.in("status", sanitizedStatuses);
  }

  if (!options?.includeBanned) {
    query = query.eq("seller.is_banned", false);
  }

  const filters = options?.filters;
  if (filters) {
    query = applyListingFilterPredicates(query, filters, {
      legacySchema: options?.legacySchema,
    });
  }

  query = applyLexicographicalCursor(query, options);

  if (options?.countOnly) return query as ListingQuery;

  const sort = filters?.sort ?? "newest";
  const isAscendingSort = getCursorDirection(sort) === "asc";

  if (!filters?.sort || filters.sort === "newest") {
    if (!options?.legacySchema) {
      query = query
        .order("top_rank_until", { ascending: false, nullsFirst: false })
        .order("homepage_showcase_until", { ascending: false, nullsFirst: false })
        .order("category_showcase_until", { ascending: false, nullsFirst: false })
        .order("detailed_search_showcase_until", { ascending: false, nullsFirst: false });
    }

    query = query.order("featured", { ascending: false });
  }

  query = query.order("seller(verification_status)", { ascending: false, nullsFirst: false });

  switch (sort) {
    case "price_asc":
      query = query.order("price", { ascending: true }).order("id", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false }).order("id", { ascending: false });
      break;
    case "mileage_asc":
      query = query.order("mileage", { ascending: true }).order("id", { ascending: true });
      break;
    case "year_desc":
      query = query.order("year", { ascending: false }).order("id", { ascending: false });
      break;
    case "oldest":
      query = query.order("created_at", { ascending: true }).order("id", { ascending: true });
      break;
    case "mileage_desc":
      query = query.order("mileage", { ascending: false }).order("id", { ascending: false });
      break;
    case "year_asc":
      query = query.order("year", { ascending: true }).order("id", { ascending: true });
      break;
    case "newest":
    default:
      query = query
        .order("bumped_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });
      break;
  }

  const { from, to } = sanitizeListingPagination(filters);
  return query.range(from, to) as ListingQuery;
}
