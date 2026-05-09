import { PostgrestFilterBuilder } from "@supabase/postgrest-js";

import type { Listing } from "@/types";
import type { Database } from "@/types/supabase";

import type { ListingRow } from "./mappers/listing-row.mapper";

type ListingsTable = Database["public"]["Tables"]["listings"];

export type ListingTableRow = ListingsTable["Row"];
export type ListingRelationships = ListingsTable["Relationships"];

export type ListingQuery<TResult = ListingRow[]> = PostgrestFilterBuilder<
  { PostgrestVersion?: string },
  Database["public"],
  ListingTableRow,
  TResult,
  "listings",
  ListingRelationships
>;

export type ListingQueryError = {
  code?: string;
  message?: string;
} | null;

export type ListingQueryResult<TRow = ListingRow> = {
  count?: number | null;
  data: TRow[] | null;
  error: ListingQueryError;
};

export interface ListingBaseQueryOptions {
  ids?: string[];
  listingId?: string;
  sellerId?: string;
  slug?: string;
  statuses?: Listing["status"][];
  filters?: import("@/types").ListingFilters;
  legacySchema?: boolean;
  countOnly?: boolean;
  withCount?: boolean;
  cursor?: {
    id: string;
    value: string | number;
    column: string;
  };
  includeBanned?: boolean;
}

export interface PaginatedListingsResult {
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
  metadata?: {
    droppedFilters?: string[];
    warning?: string;
    [key: string]: unknown;
  };
}

export interface SimilarListingsOptions {
  slug: string;
  brand: string;
  city: string;
  limit?: number;
}
