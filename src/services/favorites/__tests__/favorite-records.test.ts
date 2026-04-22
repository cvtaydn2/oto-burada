import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import {
  addDatabaseFavorite,
  getDatabaseFavoriteIds,
  removeDatabaseFavorite,
} from "../favorite-records";

vi.mock("@/lib/supabase/admin");

type FavoriteQueryResult = {
  data: Array<{ listing_id: string }> | null;
  error: { message: string } | null;
};

describe("favorite-records service", () => {
  const mockChain = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
    returns: vi.fn(),
    then: vi.fn(),
  };
  const mockAdminClient = {
    from: vi.fn(() => mockChain),
  };

  let nextResolveValue: FavoriteQueryResult = { data: [], error: null };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(mockAdminClient as never);

    nextResolveValue = { data: [{ listing_id: "1" }, { listing_id: "2" }], error: null };

    mockChain.select = vi.fn().mockReturnValue(mockChain);
    mockChain.eq = vi.fn().mockReturnValue(mockChain);
    mockChain.in = vi.fn().mockReturnValue(mockChain);
    mockChain.delete = vi.fn().mockReturnValue(mockChain);
    mockChain.upsert = vi.fn().mockReturnValue(mockChain);
    mockChain.returns = vi.fn().mockImplementation(() => Promise.resolve(nextResolveValue));

    mockChain.then = vi
      .fn()
      .mockImplementation((onFulfilled: (value: FavoriteQueryResult) => unknown) => {
        return Promise.resolve(nextResolveValue).then(onFulfilled);
      });
  });

  describe("getDatabaseFavoriteIds", () => {
    it("should return a list of listing IDs", async () => {
      const ids = await getDatabaseFavoriteIds("user-1");
      expect(ids).toEqual(["1", "2"]);
    });

    it("should return null on error", async () => {
      nextResolveValue = { data: null, error: { message: "DB Error" } };
      const ids = await getDatabaseFavoriteIds("user-1");
      expect(ids).toBeNull();
    });
  });

  describe("addDatabaseFavorite", () => {
    it("should add a favorite and return the updated list", async () => {
      const ids = await addDatabaseFavorite("user-1", "3");
      expect(mockChain.upsert).toHaveBeenCalled();
      expect(ids).toEqual(["1", "2"]);
    });
  });

  describe("removeDatabaseFavorite", () => {
    it("should remove a favorite and return the updated list", async () => {
      const ids = await removeDatabaseFavorite("user-1", "1");
      expect(mockChain.delete).toHaveBeenCalled();
      expect(ids).toEqual(["1", "2"]);
    });
  });
});
