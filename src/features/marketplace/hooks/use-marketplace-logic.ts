"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";

import { createSearchParamsFromListingFilters } from "@/services/listings/listing-filters";
import { type Listing, type ListingFilters } from "@/types";

import { useUnifiedFilters } from "./use-unified-filters";

interface UseMarketplaceLogicProps {
  initialResult: {
    listings: Listing[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  initialFilters: ListingFilters;
}

export function useMarketplaceLogic({ initialResult, initialFilters }: UseMarketplaceLogicProps) {
  const {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    applyFilters,
    activeCount: activeFiltersCount,
    isPending,
  } = useUnifiedFilters(initialFilters);

  // Infinite Query - Only depends on filters (which are synced with URL)
  const queryKey = ["listings", filters];

  const fetchListings = async ({ pageParam }: { pageParam: number }) => {
    const params = createSearchParamsFromListingFilters({ ...filters, page: pageParam });
    const res = await fetch(`/api/listings?${params.toString()}`);
    if (!res.ok) throw new Error("İlanlar yüklenirken hata oluştu.");
    const json = await res.json();
    return json.data as typeof initialResult;
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey,
    queryFn: fetchListings,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialData: {
      pages: [initialResult],
      pageParams: [1],
    },
  });

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isSortOpen, setIsSortOpen] = useState(false);

  const allListings = data?.pages.flatMap((p) => p.listings) ?? initialResult.listings;
  const total = data?.pages[0]?.total ?? initialResult.total;

  return {
    filters,
    setFilters,
    isPending,
    viewMode,
    setViewMode,
    isSortOpen,
    setIsSortOpen,
    activeFiltersCount,
    allListings,
    total,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    handleFilterChange: updateFilter,
    handleReset: resetFilters,
    applyFilters,
  };
}
