import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

import {
  applyListingFilterPredicates,
  sanitizeListingPagination,
  sanitizeListingStatuses,
} from "./listing-query-predicates";
import type { ListingBaseQueryOptions, ListingQuery } from "./listing-query-types";

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
    );

  const sellerId = options?.sellerId ?? options?.filters?.sellerId;
  if (sellerId) query = query.eq("seller_id", sellerId);
  if (options?.listingId) query = query.eq("id", options.listingId);
  if (options?.slug) query = query.eq("slug", options.slug);
  if (options?.ids?.length) query = query.in("id", options.ids);

  const sanitizedStatuses = sanitizeListingStatuses(options?.statuses);
  if (sanitizedStatuses.length > 0) {
    query = query.in("status", sanitizedStatuses);
  }

  if (options?.cursor) {
    query = query.lt(options.cursor.column, options.cursor.value);
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

  if (options?.countOnly) return query;

  const sort = filters?.sort ?? "newest";

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
      query = query.order("price", { ascending: true }).order("created_at", { ascending: false });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false }).order("created_at", { ascending: false });
      break;
    case "mileage_asc":
      query = query.order("mileage", { ascending: true }).order("created_at", { ascending: false });
      break;
    case "year_desc":
      query = query.order("year", { ascending: false }).order("created_at", { ascending: false });
      break;
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "mileage_desc":
      query = query
        .order("mileage", { ascending: false })
        .order("created_at", { ascending: false });
      break;
    case "year_asc":
      query = query.order("year", { ascending: true }).order("created_at", { ascending: false });
      break;
    case "newest":
    default:
      query = query
        .order("bumped_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      break;
  }

  const { from, to } = sanitizeListingPagination(filters);
  return query.range(from, to);
}
