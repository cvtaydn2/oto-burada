import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_LISTING_FILTERS } from "@/features/marketplace/services/listing-filters";

import { useUnifiedFilters } from "../use-unified-filters";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("useUnifiedFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("brand değişince model ve carTrim alanlarını sıfırlar", () => {
    const { result } = renderHook(() =>
      useUnifiedFilters({
        brand: "BMW",
        model: "320i",
        carTrim: "M Sport",
        page: 2,
        limit: 20,
      })
    );

    act(() => {
      result.current.updateFilter("brand", "Audi");
    });

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(result.current.filters.brand).toBe("Audi");
    expect(result.current.filters.model).toBeUndefined();
    expect(result.current.filters.carTrim).toBeUndefined();
    expect(result.current.filters.page).toBe(1);
  });

  it("immediate=true olduğunda debounce beklemeden push eder", () => {
    const { result } = renderHook(() =>
      useUnifiedFilters({
        brand: "BMW",
        page: 1,
        limit: 20,
      })
    );

    act(() => {
      result.current.updateFilter("brand", "Audi", true);
    });

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(pushMock).toHaveBeenCalledTimes(1);
  });

  it("resetFilters default filtreleri uygular", () => {
    const { result } = renderHook(() =>
      useUnifiedFilters({
        brand: "BMW",
        model: "320i",
        page: 3,
        limit: 50,
      })
    );

    act(() => {
      result.current.resetFilters();
    });

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(result.current.filters.brand).toBeUndefined();
    expect(result.current.filters.model).toBeUndefined();
    expect(result.current.filters.page).toBe(1);
    expect(result.current.filters.limit).toBe(DEFAULT_LISTING_FILTERS.limit);
  });
});
