import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRefresh = vi.fn();
const mockUseSearchParams = vi.fn();
const maybeSingle = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    refresh: mockRefresh,
  })),
  useSearchParams: mockUseSearchParams,
}));

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle,
        })),
      })),
    })),
  })),
}));

describe("payment result page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows invalid-link state when token is missing", async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams());

    const { default: PaymentResultPage } = await import("../page");
    render(<PaymentResultPage />);

    expect(await screen.findByText("Geçersiz Bağlantı")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Bu ödeme bağlantısı geçersiz veya eksik. Lütfen ödeme akışını yeniden başlatın."
      )
    ).toBeInTheDocument();
  });

  it("keeps timeout handling in pending state instead of forcing failure", () => {
    const sourceCode = readFileSync(
      resolve(process.cwd(), "src/app/dashboard/payments/result/page.tsx"),
      "utf-8"
    );

    expect(sourceCode).toContain("const maxAttempts = 5");
    expect(sourceCode).toContain('? "Ödeme Doğrulanıyor"');
    expect(sourceCode).not.toContain('setStatus("failure");');
  });
});
