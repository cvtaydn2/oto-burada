"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

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

  const queryKey = ["listings", filters];

  const fetchListings = async ({ pageParam }: { pageParam: number }) => {
    const params = createSearchParamsFromListingFilters({ ...filters, page: pageParam });
    const res = await fetch(`/api/listings?${params.toString()}`);
    if (!res.ok) throw new Error("İlanlar yüklenirken hata oluştu.");
    const json = await res.json();
    return json.data as typeof initialResult;
  };

  const query = useInfiniteQuery({
    queryKey,
    queryFn: fetchListings,
    initialPageParam: filters.page ?? 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    placeholderData: {
      pages: [initialResult],
      pageParams: [filters.page ?? 1],
    },
    retry: 2,
    retryDelay: 1000,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isError, error, refetch } = query;

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isSortOpen, setIsSortOpen] = useState(false);

  const fetchNextPageRef = useRef(fetchNextPage);
  useEffect(() => {
    fetchNextPageRef.current = fetchNextPage;
  }, [fetchNextPage]);
  const stableFetchNextPage = () => {
    fetchNextPageRef.current();
  };

  const allListings = data?.pages.flatMap((p) => p.listings) ?? initialResult.listings;
  const total = data?.pages[0]?.total ?? initialResult.total;
  const currentPage = filters.page ?? initialResult.page ?? 1;
  const currentLimit = filters.limit ?? initialResult.limit ?? 12;
  const totalPages = Math.max(1, Math.ceil(total / currentLimit));

  type InitialResultType = UseMarketplaceLogicProps["initialResult"];
  type PageWithMetadata = InitialResultType & {
    metadata?: { droppedFilters?: string[]; warning?: string };
  };

  const droppedFilters =
    (data?.pages[0] as PageWithMetadata | undefined)?.metadata?.droppedFilters ??
    (initialResult as PageWithMetadata).metadata?.droppedFilters;
  const droppedWarning =
    (data?.pages[0] as PageWithMetadata | undefined)?.metadata?.warning ??
    (initialResult as PageWithMetadata).metadata?.warning;

  const handlePageChange = (page: number) => {
    applyFilters({ ...filters, page, limit: currentLimit }, true);
  };

  const handlePageSizeChange = (limit: number) => {
    applyFilters({ ...filters, page: 1, limit }, true);
  };

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
    currentPage,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage: stableFetchNextPage,
    handleFilterChange: updateFilter,
    handleReset: resetFilters,
    applyFilters,
    refetch,
    isError,
    error,
    droppedFilters,
    droppedWarning,
  };
}
