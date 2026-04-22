import { beforeEach, describe, expect, it, vi } from "vitest";

import { readFavoriteIds, writeFavoriteIds } from "../favorites-storage";

describe("Favorites Storage Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage between tests
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  it("should return empty array when no favorites stored", () => {
    const result = readFavoriteIds();
    expect(result).toEqual([]);
  });

  it("should read favorites from localStorage", () => {
    // Mock window and localStorage
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn().mockReturnValue(JSON.stringify(["id1", "id2", "id3"])),
      },
    });

    const result = readFavoriteIds();
    expect(result).toEqual(["id1", "id2", "id3"]);
  });

  it("should return empty array for invalid JSON", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn().mockReturnValue("invalid json"),
      },
    });

    const result = readFavoriteIds();
    expect(result).toEqual([]);
  });

  it("should return empty array for non-array JSON", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn().mockReturnValue(JSON.stringify({ foo: "bar" })),
      },
    });

    const result = readFavoriteIds();
    expect(result).toEqual([]);
  });

  it("should filter out non-string values from array", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn().mockReturnValue(JSON.stringify(["id1", 123, null, "id2"])),
      },
    });

    const result = readFavoriteIds();
    expect(result).toEqual(["id1", "id2"]);
  });

  it("should write favorites to localStorage", () => {
    const mockSetItem = vi.fn();
    vi.stubGlobal("window", {
      localStorage: {
        setItem: mockSetItem,
      },
    });

    writeFavoriteIds(["id1", "id2"]);
    expect(mockSetItem).toHaveBeenCalledWith(
      "oto-burada:favorites",
      JSON.stringify(["id1", "id2"])
    );
  });

  it("should handle empty array", () => {
    const mockSetItem = vi.fn();
    vi.stubGlobal("window", {
      localStorage: {
        setItem: mockSetItem,
      },
    });

    writeFavoriteIds([]);
    expect(mockSetItem).toHaveBeenCalledWith("oto-burada:favorites", "[]");
  });
});
