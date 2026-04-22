/**
 * Tests: PricingPage — payment-disabled state
 * Risk: ödeme kapalıyken UI tekrar normal satış ekranı gösterebilir.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// ── Use vi.hoisted to avoid hoisting issues with vi.mock factories ─────────────
const { mockIsPaymentEnabled } = vi.hoisted(() => ({
  mockIsPaymentEnabled: vi.fn(),
}));

vi.mock("@/lib/payment/config", () => ({
  isPaymentEnabled: mockIsPaymentEnabled,
}));

vi.mock("@/services/admin/plans", () => ({
  getPublicPricingPlans: vi.fn().mockResolvedValue([
    { id: "free", name: "Ücretsiz", price: 0, credits: 1, features: {}, is_active: true },
    { id: "pro", name: "Pro", price: 299, credits: 10, features: {}, is_active: true },
  ]),
}));

vi.mock("@/components/dashboard/pricing-plans", () => ({
  PricingPlans: ({ initialPlans }: { initialPlans: { id: string; name: string }[] }) => (
    <div data-testid="pricing-plans">
      {initialPlans.map((p) => (
        <div key={p.id} data-testid={`plan-${p.id}`}>
          {p.name}
        </div>
      ))}
    </div>
  ),
}));

import PricingPage from "@/app/dashboard/pricing/page";

describe("PricingPage — payment-disabled state", () => {
  it("shows payment-disabled banner when payments are off", async () => {
    mockIsPaymentEnabled.mockReturnValue(false);

    const jsx = await PricingPage({ searchParams: Promise.resolve({}) });
    render(jsx);

    expect(screen.getByText(/ödeme sistemi şu anda kapalı/i)).toBeInTheDocument();
  });

  it("filters out paid plans when payments are disabled", async () => {
    mockIsPaymentEnabled.mockReturnValue(false);

    const jsx = await PricingPage({ searchParams: Promise.resolve({}) });
    render(jsx);

    expect(screen.getByTestId("plan-free")).toBeInTheDocument();
    expect(screen.queryByTestId("plan-pro")).toBeNull();
  });

  it("shows all plans when payments are enabled", async () => {
    mockIsPaymentEnabled.mockReturnValue(true);

    const jsx = await PricingPage({ searchParams: Promise.resolve({}) });
    render(jsx);

    expect(screen.getByTestId("plan-free")).toBeInTheDocument();
    expect(screen.getByTestId("plan-pro")).toBeInTheDocument();
    expect(screen.queryByText(/ödeme sistemi şu anda kapalı/i)).toBeNull();
  });

  it("shows 'payments=disabled' message from searchParams", async () => {
    mockIsPaymentEnabled.mockReturnValue(true);

    const jsx = await PricingPage({
      searchParams: Promise.resolve({ payments: "disabled" }),
    });
    render(jsx);

    expect(screen.getByText(/ücretli paket satın alma geçici olarak kapalı/i)).toBeInTheDocument();
  });

  it("shows 'plan=inactive' message from searchParams", async () => {
    mockIsPaymentEnabled.mockReturnValue(true);

    const jsx = await PricingPage({
      searchParams: Promise.resolve({ plan: "inactive" }),
    });
    render(jsx);

    expect(screen.getByText(/seçtiğiniz paket şu anda satışta değil/i)).toBeInTheDocument();
  });

  it("shows 'plan=missing' message from searchParams", async () => {
    mockIsPaymentEnabled.mockReturnValue(true);

    const jsx = await PricingPage({
      searchParams: Promise.resolve({ plan: "missing" }),
    });
    render(jsx);

    expect(screen.getByText(/seçtiğiniz paket bulunamadı/i)).toBeInTheDocument();
  });
});
