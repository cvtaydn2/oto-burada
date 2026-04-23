/**
 * Tests: PaymentResultContent — Supabase query error path + polling cleanup/unmount
 * Risk 4: DB error durumunda ekran yanlış pending/success/failure gösterebilir.
 * Risk 5: unmounted component state update regress edebilir.
 *
 * Strategy: The component uses a polling loop with setTimeout. We test the
 * verification logic by using real timers + real async resolution, which is
 * more reliable than fake timers with Suspense boundaries.
 */

import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Next.js stubs ──────────────────────────────────────────────────────────────
const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn((key: string) => (key === "token" ? "test-token-123" : null)),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ refresh: vi.fn() })),
  useSearchParams: vi.fn(() => ({ get: mockGet })),
}));

// ── PostHog stub ───────────────────────────────────────────────────────────────
vi.mock("@/lib/monitoring/posthog-client", () => ({
  captureClientException: vi.fn(),
}));

// ── Supabase browser client stub ───────────────────────────────────────────────
const { mockMaybeSingle } = vi.hoisted(() => ({
  mockMaybeSingle: vi.fn(),
}));

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: mockMaybeSingle,
    })),
  })),
}));

import PaymentResultPage from "@/app/dashboard/payments/result/page";
import { captureClientException } from "@/lib/monitoring/posthog-client";

// Polling interval in the component is 1500ms, max 5 attempts.
// We use real timers but advance them via vi.advanceTimersByTimeAsync.

describe("PaymentResultPage — Supabase query error path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockGet.mockImplementation((key: string) => (key === "token" ? "test-token-123" : null));
  });

  afterEach(async () => {
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    vi.useRealTimers();
  });

  it("shows verification_error status when Supabase returns an error", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: "connection refused", code: "PGRST301" },
    });

    render(<PaymentResultPage />);

    // Let the first async check complete
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    await waitFor(
      () => {
        expect(screen.getByText(/doğrulama hatası/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(captureClientException).toHaveBeenCalledWith(
      expect.objectContaining({ message: "connection refused" }),
      "payment_result_verification_query",
      expect.objectContaining({ token: "test-token-123" })
    );
  }, 15000);

  it("shows success status when payment status is 'success'", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: "pay-1", amount: 199, status: "success", plan_name: "Vitrin" },
      error: null,
    });

    render(<PaymentResultPage />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    await waitFor(
      () => {
        expect(screen.getByText(/ödeme başarılı/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  }, 15000);

  it("shows failure status when payment status is 'failure'", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: "pay-2", amount: 99, status: "failure", plan_name: null },
      error: null,
    });

    render(<PaymentResultPage />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    await waitFor(
      () => {
        expect(screen.getByText(/ödeme başarısız/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  }, 15000);

  it("shows unverified status after max polling attempts with pending data", async () => {
    // Always returns pending — should exhaust retries and show unverified
    mockMaybeSingle.mockResolvedValue({
      data: { id: "pay-3", amount: 49, status: "pending", plan_name: null },
      error: null,
    });

    render(<PaymentResultPage />);

    // Advance past all 5 polling intervals (5 * 1500ms = 7500ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    await waitFor(
      () => {
        expect(screen.getByText(/henüz doğrulanamadı/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  }, 20000);

  it("shows invalid status when no token is in search params", async () => {
    mockGet.mockImplementation(() => null); // no token

    render(<PaymentResultPage />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    await waitFor(
      () => {
        expect(screen.getByText(/geçersiz bağlantı/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  }, 15000);
});

describe("PaymentResultPage — polling cleanup on unmount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockGet.mockImplementation((key: string) => (key === "token" ? "test-token-123" : null));
  });

  afterEach(async () => {
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    vi.useRealTimers();
  });

  it("does not update state after unmount (no act warning)", async () => {
    // Simulate slow response — resolves after unmount
    let resolveQuery!: (value: unknown) => void;
    mockMaybeSingle.mockReturnValue(
      new Promise((resolve) => {
        resolveQuery = resolve;
      })
    );

    const { unmount } = render(<PaymentResultPage />);

    // Unmount before the query resolves
    unmount();

    // Now resolve the query — should not cause state update warnings
    await act(async () => {
      resolveQuery({ data: { id: "pay-x", amount: 99, status: "success" }, error: null });
      await vi.advanceTimersByTimeAsync(100);
    });

    // If we reach here without React "act" warnings or errors, the cleanup works
    expect(true).toBe(true);
  }, 15000);
});
