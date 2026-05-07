/**
 * Bug Condition Exploration Test — Bug 3: is_active filter returns empty brands
 *
 * These tests MUST FAIL on unfixed code.
 * Failure confirms the bug exists.
 * DO NOT fix the code when these tests fail.
 *
 * Validates: Requirements 1.5, 1.6
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// We need to mock the server client used inside lookupVehicleByPlate
vi.mock("@/features/shared/lib/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

describe("Bug 3 — plate lookup returns null when brands query is empty (EXPECTED TO FAIL on unfixed code)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Bug condition: lookupVehicleByPlate queries brands with .eq("is_active", true).
   * If the brands table has no is_active column or all records are inactive,
   * the query returns an empty array and the function returns null.
   *
   * Counterexample: lookupVehicleByPlate("34ABC123") → null (is_active filter eliminates all brands)
   */
  it("should return a PlateLookupResult (not null) when brands query returns empty due to is_active filter", async () => {
    const { createSupabaseServerClient } = await import("@/features/shared/lib/server");

    // Simulate: brands table exists but is_active filter returns nothing
    // (either column missing or all records have is_active = false)
    const mockEq = vi.fn().mockReturnThis();
    const mockLimit = vi.fn();

    // Track calls to detect is_active filter usage
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockImplementation((col: string) => {
        if (col === "is_active") {
          // Return empty — simulating the bug condition
          return {
            eq: mockEq,
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {
          eq: mockEq,
          limit: mockLimit.mockResolvedValue({ data: [{ name: "Corolla" }], error: null }),
        };
      }),
      limit: vi.fn().mockResolvedValue({ data: [{ id: 1, name: "Toyota" }], error: null }),
    });

    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    } as never);

    const { lookupVehicleByPlate } = await import("../plate-lookup");
    const result = await lookupVehicleByPlate("34ABC123");

    // On unfixed code: is_active filter is applied → brands empty → returns null → FAILS this assertion
    // On fixed code: is_active filter removed → brands returned → result is not null
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("brand");
    expect(result).toHaveProperty("model");
  });
});
