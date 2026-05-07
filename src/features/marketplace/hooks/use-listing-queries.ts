"use client";

import { useQuery } from "@tanstack/react-query";

import { apiResponseSchemas } from "@/features/shared/lib/api-responses";
import { API_ROUTES } from "@/features/shared/lib/api-routes";
import { ApiClient } from "@/features/shared/lib/client";
import { queryKeys } from "@/lib/query-keys";
import type { Listing } from "@/types";

/**
 * Hook for fetching current user's listings with TanStack Query.
 */
export function useMyListings(userId?: string) {
  return useQuery<Listing[]>({
    queryKey: userId ? queryKeys.listings.my(userId) : queryKeys.listings.all,
    queryFn: async () => {
      if (!userId) return [];
      const { success, data } = await ApiClient.request<{
        listings: Listing[];
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
      }>(`${API_ROUTES.LISTINGS.BASE}?view=my&page=1&limit=50`, {
        schema: apiResponseSchemas.paginatedListings,
      });
      return success ? data?.listings || [] : [];
    },
    enabled: !!userId,
  });
}

/**
 * Hook for fetching a single listing by ID.
 */
export function useListingDetail(id: string) {
  return useQuery<Listing | null>({
    queryKey: queryKeys.listings.detail(id),
    queryFn: async () => {
      const { success, data } = await ApiClient.request<Listing>(API_ROUTES.LISTINGS.DETAIL(id), {
        schema: apiResponseSchemas.listingDetail,
      });
      return success ? data || null : null;
    },
    enabled: !!id,
  });
}
