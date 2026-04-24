"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { ListingService } from "@/services/listings/listing-service";
import type { Listing } from "@/types";

/**
 * Hook for fetching current user's listings with TanStack Query.
 */
export function useMyListings(userId?: string) {
  return useQuery<Listing[]>({
    queryKey: userId ? queryKeys.listings.my(userId) : queryKeys.listings.all,
    queryFn: async () => {
      if (!userId) return [];
      const { success, data } = await ListingService.getMyListings();
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
      const { success, data } = await ListingService.getListingById(id);
      return success ? data || null : null;
    },
    enabled: !!id,
  });
}
