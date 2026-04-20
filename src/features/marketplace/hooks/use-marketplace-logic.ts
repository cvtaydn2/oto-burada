"use client";

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { type Listing, type ListingFilters } from "@/types";
import { createSearchParamsFromListingFilters } from "@/services/listings/listing-filters";

const DEBOUNCE_DELAY_MS = 400;

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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // URL Sync
  const [filters, setFilters] = useState<ListingFilters>(initialFilters);
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Infinite Query
  const queryKey = ["listings", initialFilters];

  const fetchListings = async ({ pageParam }: { pageParam: number }) => {
    const params = createSearchParamsFromListingFilters({ ...initialFilters, page: pageParam });
    const res = await fetch(`/api/listings?${params.toString()}`);
    if (!res.ok) throw new Error("İlanlar yüklenirken hata oluştu.");
    const json = await res.json();
    return json.data as typeof initialResult;
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: fetchListings,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialData: {
      pages: [initialResult],
      pageParams: [1]
    }
  });

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyFilters = useCallback((newFilters: ListingFilters, immediate = false) => {
    const fn = () => {
      const params = createSearchParamsFromListingFilters(newFilters);
      startTransition(() => {
        router.push(`/listings?${params.toString()}`, { scroll: true });
      });
    };

    if (immediate) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      fn();
    } else {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(fn, DEBOUNCE_DELAY_MS);
    }
  }, [router, startTransition]);

  const handleFilterChange = useCallback(<K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => {
    const newFilters: ListingFilters = { ...filters, [key]: value, page: 1 };

    if (key === "brand") {
      newFilters.model = undefined;
      newFilters.carTrim = undefined;
    }
    if (key === "model") {
      newFilters.carTrim = undefined;
    }
    if (key === "city") {
      newFilters.district = undefined;
    }

    setFilters(newFilters);

    const immediateKeys: (keyof ListingFilters)[] = ["sort", "limit", "brand", "model", "carTrim", "city", "district", "fuelType", "transmission", "hasExpertReport"];
    if (immediateKeys.includes(key)) {
      applyFilters(newFilters, true);
      return;
    }

    applyFilters(newFilters, false);
  }, [filters, applyFilters]);

  const handleReset = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const resetFilters: ListingFilters = { limit: filters.limit ?? initialResult.limit, page: 1, sort: "newest" };
    setFilters(resetFilters);
    const params = createSearchParamsFromListingFilters(resetFilters);
    startTransition(() => {
      router.push(`/listings?${params.toString()}`, { scroll: false });
    });
  }, [filters.limit, initialResult.limit, router, startTransition]);

  // Derived State
  const activeFiltersCount = Object.entries(filters).filter(([key, val]) => {
    if (key === "limit" || key === "sort" || key === "page") return false;
    return val !== undefined && val !== "";
  }).length;

  const allListings = data?.pages.flatMap(p => p.listings) ?? initialResult.listings;

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

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
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    handleFilterChange,
    handleReset,
    applyFilters
  };
}
