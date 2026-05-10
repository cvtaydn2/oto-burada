"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import {
  buildMarketplaceSearchParams,
  canonicalizeMarketplaceFilters,
  countActiveMarketplaceFilters,
  isSameMarketplaceQuery,
  type MarketplaceListingsQuery,
} from "@/features/marketplace/services/marketplace-query";
import { type Listing, type ListingFilters } from "@/types";

interface UseMarketplaceLogicProps {
  initialResult: {
    listings: Listing[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  initialFilters: ListingFilters;
  initialQuery: MarketplaceListingsQuery;
}

export function useMarketplaceLogic({
  initialResult,
  initialFilters,
  initialQuery,
}: UseMarketplaceLogicProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Separate visual state from authoritative fetch query
  const [draftFilters, setDraftFilters] = useState<ListingFilters>(initialFilters);
  const [activeQuery, setActiveQuery] = useState<MarketplaceListingsQuery>(initialQuery);

  const activeFiltersCount = countActiveMarketplaceFilters(draftFilters);

  const handleFilterChange = useCallback(
    <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => {
      setDraftFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const applyFilters = useCallback(
    (newFilters: ListingFilters, immediate = true) => {
      const nextQuery = canonicalizeMarketplaceFilters(newFilters);

      if (isSameMarketplaceQuery(activeQuery, nextQuery)) {
        // Optimization: Don't trigger full re-render cycles if the network contract is unchanged
        return;
      }

      const performNavigation = () => {
        const params = buildMarketplaceSearchParams(nextQuery);
        setActiveQuery(nextQuery);

        // Force router updates inside transition to keep UI responsive during server action batching
        startTransition(() => {
          router.push(`/listings?${params.toString()}`, { scroll: immediate });
        });
      };

      if (immediate) {
        performNavigation();
      } else {
        // Short circuit or debounce implementation space holder
        performNavigation();
      }
    },
    [activeQuery, router]
  );

  const handleReset = useCallback(() => {
    const cleanFilters: ListingFilters = { page: 1, limit: 12, sort: "newest" };
    setDraftFilters(cleanFilters);
    applyFilters(cleanFilters);
  }, [applyFilters]);

  const queryKey = ["listings", activeQuery];

  const fetchListings = async ({ pageParam }: { pageParam: number }) => {
    const combinedQuery = { ...activeQuery, page: pageParam };
    const params = buildMarketplaceSearchParams(combinedQuery);

    const res = await fetch(`/api/listings?${params.toString()}`);
    if (!res.ok) throw new Error("İlanlar yüklenirken hata oluştu.");

    const json = await res.json();
    return json.data as typeof initialResult;
  };

  const query = useInfiniteQuery({
    queryKey,
    queryFn: fetchListings,
    initialPageParam: activeQuery.page,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    placeholderData: {
      pages: [initialResult],
      pageParams: [initialQuery.page],
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

  const stableFetchNextPage = useCallback(() => {
    fetchNextPageRef.current();
  }, []);

  const allListings = data?.pages.flatMap((p) => p.listings) ?? initialResult.listings;
  const total = data?.pages[0]?.total ?? initialResult.total;
  const currentPage = activeQuery.page;
  const totalPages = Math.max(1, Math.ceil(total / activeQuery.limit));

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

  const handlePageChange = useCallback(
    (page: number) => {
      const updatedFilters = { ...draftFilters, page };
      setDraftFilters(updatedFilters);
      applyFilters(updatedFilters, true);
    },
    [draftFilters, applyFilters]
  );

  const handlePageSizeChange = useCallback(
    (limit: number) => {
      const updatedFilters = { ...draftFilters, page: 1, limit };
      setDraftFilters(updatedFilters);
      applyFilters(updatedFilters, true);
    },
    [draftFilters, applyFilters]
  );

  return {
    filters: draftFilters,
    setFilters: setDraftFilters,
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
    handleFilterChange,
    handleReset,
    applyFilters,
    refetch,
    isError,
    error,
    droppedFilters,
    droppedWarning,
  };
}
