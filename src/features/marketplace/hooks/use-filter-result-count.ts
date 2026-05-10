"use client";

import { useDeferredValue, useEffect, useState } from "react";

import { createSearchParamsFromListingFilters } from "@/features/marketplace/services/listing-filters";
import { type ListingFilters } from "@/types";

interface UseFilterResultCountOptions {
  debounceMs?: number;
  enabled?: boolean;
}

export function useFilterResultCount(
  filters: ListingFilters,
  initialCount: number = 0,
  options: UseFilterResultCountOptions = {}
) {
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const deferredFilters = useDeferredValue(filters);
  const { debounceMs = 600, enabled = true } = options;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      const params = createSearchParamsFromListingFilters({
        ...deferredFilters,
        limit: 1,
        page: 1,
      });

      setIsLoading(true);

      try {
        const response = await fetch(`/api/listings?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) return;

        const payload = await response.json();
        const total = payload.data?.total;

        if (typeof total === "number") {
          setCount(total);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError" && process.env.NODE_ENV !== "production") {
          console.warn("Filter count fetch background failure:", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [debounceMs, deferredFilters, enabled]);

  return { count, isLoading: enabled ? isLoading : false };
}
