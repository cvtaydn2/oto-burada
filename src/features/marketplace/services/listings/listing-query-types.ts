/* eslint-disable @typescript-eslint/no-explicit-any */

import { PostgrestFilterBuilder } from "@supabase/postgrest-js";

import type { Listing } from "@/types";

import type { ListingRow } from "./mappers/listing-row.mapper";

export type ListingQuery = PostgrestFilterBuilder<any, any, any, any, any>;

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
