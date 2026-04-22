"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { createSearchParamsFromListingFilters } from "@/services/listings/listing-filters";
import { type ListingFilters } from "@/types";

const DEBOUNCE_DELAY_MS = 500;

export function useUnifiedFilters(initialFilters: ListingFilters) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<ListingFilters>(initialFilters);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state if initialFilters changes (e.g., URL updated from outside)
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const applyFilters = useCallback(
    (newFilters: ListingFilters, immediate = false) => {
      const fn = () => {
        const params = createSearchParamsFromListingFilters({ ...newFilters, page: 1 });
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

        // Hierarchical Resets
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
    const resetValues: ListingFilters = { sort: "newest", page: 1 };
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
