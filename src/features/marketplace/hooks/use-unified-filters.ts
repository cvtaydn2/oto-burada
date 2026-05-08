"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";

import {
  createSearchParamsFromListingFilters,
  DEFAULT_LISTING_FILTERS,
} from "@/features/marketplace/services/listing-filters";
import { type ListingFilters } from "@/types";

const DEBOUNCE_DELAY_MS = 500;

export function useUnifiedFilters(initialFilters: ListingFilters) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<ListingFilters>(initialFilters);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyFilters = useCallback(
    (newFilters: ListingFilters, immediate = false) => {
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
    },
    [router]
  );

  const updateFilter = useCallback(
    <K extends keyof ListingFilters>(key: K, value: ListingFilters[K], immediate = false) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value, page: 1 };

        if (key === "brand") {
          next.model = undefined;
          next.carTrim = undefined;
        }
        if (key === "model") {
          next.carTrim = undefined;
        }
        if (key === "city") {
          next.district = undefined;
        }

        applyFilters(next, immediate);
        return next;
      });
    },
    [applyFilters]
  );

  const resetFilters = useCallback(() => {
    const resetValues: ListingFilters = { ...DEFAULT_LISTING_FILTERS };
    setFilters(resetValues);
    applyFilters(resetValues, true);
  }, [applyFilters]);

  const activeCount = Object.entries(filters).filter(([key, val]) => {
    if (["limit", "offset", "sort", "page"].includes(key)) return false;
    return val !== undefined && val !== "" && val !== 0;
  }).length;

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    applyFilters,
    activeCount,
    isPending,
  };
}
