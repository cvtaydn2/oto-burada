/**
 * Preservation Tests — Bug 2: getSupportTickets full_name mapping
 *
 * These tests MUST PASS on unfixed code — they establish baseline behavior
 * that must not regress after fixes.
 *
 * Validates: Requirements 3.3, 3.4
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/admin");

describe("Preservation — getSupportTickets full_name mapping (baseline, must pass on unfixed code)", () => {
  const mockFrom = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.mocked(createSupabaseAdminClient).mockReturnValue({ from: mockFrom } as never);
  });

  /**
   * When the query succeeds (no DB error), getSupportTickets should correctly
   * map the full_name field from the profiles join.
   *
   * This behavior is preserved in both unfixed and fixed code.
   */
  it("should correctly map full_name from profiles when query succeeds", async () => {
    const mockTicketRow = {
      id: "ticket-1",
      subject: "Test konusu",
      description: "Test açıklama",
      status: "open",
      priority: "medium",
      created_at: "2024-01-01T00:00:00Z",
      profiles: { full_name: "Ahmet Yılmaz", email: "ahmet@example.com" },
    };

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [mockTicketRow],
          error: null,
        }),
      }),
    });

    const { getSupportTickets } = await import("../support");
    const result = await getSupportTickets();

    expect(result).toHaveLength(1);
    expect(result[0].profile).toBeDefined();
    expect(result[0].profile?.full_name).toBe("Ahmet Yılmaz");
  });

  it("should return empty array when query returns no data", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    });

    const { getSupportTickets } = await import("../support");
    const result = await getSupportTickets();

    expect(result).toEqual([]);
  });

  it("should correctly map ticket fields (id, subject, status, priority)", async () => {
    const mockTicketRow = {
      id: "ticket-42",
      subject: "Ödeme sorunu",
      description: "Ödeme yapılamıyor",
      status: "pending",
      priority: "high",
      created_at: "2024-06-15T10:00:00Z",
      profiles: { full_name: "Fatma Kaya", email: "fatma@example.com" },
    };

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [mockTicketRow],
          error: null,
        }),
      }),
    });

    const { getSupportTickets } = await import("../support");
    const result = await getSupportTickets();

    expect(result[0].id).toBe("ticket-42");
    expect(result[0].subject).toBe("Ödeme sorunu");
    expect(result[0].status).toBe("pending");
    expect(result[0].priority).toBe("high");
  });

  it("should handle profiles as array (Supabase join can return array)", async () => {
    const mockTicketRow = {
      id: "ticket-2",
      subject: "Soru",
      description: "Açıklama",
      status: "open",
      priority: "low",
      created_at: "2024-01-02T00:00:00Z",
      profiles: [{ full_name: "Mehmet Demir", email: "mehmet@example.com" }],
    };

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [mockTicketRow],
          error: null,
        }),
      }),
    });

    const { getSupportTickets } = await import("../support");
    const result = await getSupportTickets();

    expect(result[0].profile?.full_name).toBe("Mehmet Demir");
  });
});
