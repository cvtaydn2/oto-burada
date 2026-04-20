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

  // 1. Applied State (Synced with URL)
  const [appliedFilters, setAppliedFilters] = useState<ListingFilters>(initialFilters);
  
  // 2. Draft State (Local UI feedback)
  const [filters, setDraftFilters] = useState<ListingFilters>(initialFilters);

  // Sync back when URL/Props change
  useEffect(() => {
    setAppliedFilters(initialFilters);
    setDraftFilters(initialFilters);
  }, [initialFilters]);

  // Infinite Query - Only depends on APPLIED filters
  const queryKey = ["listings", appliedFilters];

  const fetchListings = async ({ pageParam }: { pageParam: number }) => {
    const params = createSearchParamsFromListingFilters({ ...appliedFilters, page: pageParam });
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
        // Applied state will be updated via useEffect from props
      });
    };

    if (immediate) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      fn();
    } else {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(fn, DEBOUNCE_DELAY_MS);
    }
  }, [router]);

  const handleFilterChange = useCallback(<K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => {
    const newFilters: ListingFilters = { ...filters, [key]: value, page: 1 };

    // Hiyerarşik resetler (Business logic)
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

    // Hemen UI'ı güncelle
    setDraftFilters(newFilters);

    const immediateKeys: (keyof ListingFilters)[] = ["sort", "limit", "hasExpertReport"];
    const isImmediate = immediateKeys.includes(key);
    
    applyFilters(newFilters, isImmediate);
  }, [filters, applyFilters]);

  const handleReset = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const resetFilters: ListingFilters = { limit: filters.limit ?? initialResult.limit, page: 1, sort: "newest" };
    setDraftFilters(resetFilters);
    const params = createSearchParamsFromListingFilters(resetFilters);
    startTransition(() => {
      router.push(`/listings?${params.toString()}`, { scroll: false });
    });
  }, [filters.limit, initialResult.limit, router]);

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
    filters, // draft filters for UI
    setFilters: setDraftFilters,
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
