/**
 * Tests: CheckoutPage — payment-disabled gating (server-side redirects)
 * Risk: checkout route'a erişim tekrar client-side'a kalabilir.
 *
 * CheckoutPage is a Next.js async Server Component that calls redirect().
 * We verify the redirect logic by mocking redirect and asserting it's called
 * with the correct target for each gating scenario.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// ── next/navigation mock — use vi.hoisted to avoid hoisting issues ─────────────
const { mockRedirect } = vi.hoisted(() => ({
  mockRedirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

// ── Auth session mock ──────────────────────────────────────────────────────────
vi.mock("@/lib/auth/session", () => ({
  requireUser: vi.fn().mockResolvedValue({ id: "user-1", email: "user@example.com" }),
}));

// ── Payment config mock ────────────────────────────────────────────────────────
const { mockIsPaymentEnabled } = vi.hoisted(() => ({
  mockIsPaymentEnabled: vi.fn(),
}));

vi.mock("@/lib/payment/config", () => ({
  isPaymentEnabled: mockIsPaymentEnabled,
}));

// ── Plans service mock ─────────────────────────────────────────────────────────
const { mockGetAdminPricingPlans } = vi.hoisted(() => ({
  mockGetAdminPricingPlans: vi.fn(),
}));

vi.mock("@/services/admin/plans", () => ({
  getAdminPricingPlans: mockGetAdminPricingPlans,
}));

// ── CheckoutClient stub ────────────────────────────────────────────────────────
vi.mock("@/components/dashboard/checkout-client", () => ({
  CheckoutClient: () => null,
}));

import CheckoutPage from "@/app/dashboard/pricing/checkout/page";

const FREE_PLAN = { id: "free", name: "Ücretsiz", price: 0, credits: 1, is_active: true };
const PAID_PLAN = { id: "pro", name: "Pro", price: 299, credits: 10, is_active: true };
const INACTIVE_PLAN = { id: "old", name: "Eski", price: 99, credits: 5, is_active: false };

describe("CheckoutPage — server-side gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPaymentEnabled.mockReturnValue(true);
    mockGetAdminPricingPlans.mockResolvedValue([FREE_PLAN, PAID_PLAN, INACTIVE_PLAN]);
  });

  it("redirects to /dashboard/pricing when no planId is provided", async () => {
    await expect(CheckoutPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      "REDIRECT:/dashboard/pricing"
    );
  });

  it("redirects to /dashboard/pricing?plan=missing when planId does not exist", async () => {
    await expect(
      CheckoutPage({ searchParams: Promise.resolve({ plan: "nonexistent" }) })
    ).rejects.toThrow("REDIRECT:/dashboard/pricing?plan=missing");
  });

  it("redirects to /dashboard/pricing?plan=inactive when plan is not active", async () => {
    await expect(CheckoutPage({ searchParams: Promise.resolve({ plan: "old" }) })).rejects.toThrow(
      "REDIRECT:/dashboard/pricing?plan=inactive"
    );
  });

  it("redirects to /dashboard/pricing?payments=disabled when payments are off and plan is paid", async () => {
    mockIsPaymentEnabled.mockReturnValue(false);

    await expect(CheckoutPage({ searchParams: Promise.resolve({ plan: "pro" }) })).rejects.toThrow(
      "REDIRECT:/dashboard/pricing?payments=disabled"
    );
  });

  it("does NOT redirect for free plan even when payments are disabled", async () => {
    mockIsPaymentEnabled.mockReturnValue(false);

    // Should render without throwing (free plan, price=0)
    const result = await CheckoutPage({ searchParams: Promise.resolve({ plan: "free" }) });
    expect(result).toBeDefined();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("does NOT redirect for paid plan when payments are enabled", async () => {
    mockIsPaymentEnabled.mockReturnValue(true);

    const result = await CheckoutPage({ searchParams: Promise.resolve({ plan: "pro" }) });
    expect(result).toBeDefined();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
