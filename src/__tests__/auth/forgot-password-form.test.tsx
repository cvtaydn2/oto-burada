/**
 * Tests: ForgotPasswordForm — success UI state
 * Risk: redirect doğru olsa bile kullanıcıya success feedback veya input reset akışı regress edebilir.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// useActionState is a React hook — we mock it to control state
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useActionState: vi.fn(),
  };
});

vi.mock("@/lib/auth/actions", () => ({
  forgotPasswordAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

import { useActionState } from "react";

import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

const mockUseActionState = vi.mocked(useActionState);

describe("ForgotPasswordForm — success UI state", () => {
  it("shows the form (not success panel) in initial state", () => {
    mockUseActionState.mockReturnValue([{}, vi.fn(), false] as unknown as ReturnType<
      typeof useActionState
    >);

    render(<ForgotPasswordForm />);

    // Form input should be present
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    // Success panel should NOT be visible — check for the success-only element
    expect(screen.queryByTestId("success-panel")).toBeNull();
    // The success message text should not appear
    expect(screen.queryByText(/sıfırlama bağlantısı e-posta adresinize gönderildi/i)).toBeNull();
  });

  it("hides the form and shows success panel when state.success is set", () => {
    mockUseActionState.mockReturnValue([
      {
        success: "Sıfırlama bağlantısı e-posta adresinize gönderildi.",
        fields: { email: "user@example.com" },
      },
      vi.fn(),
      false,
    ] as unknown as ReturnType<typeof useActionState>);

    render(<ForgotPasswordForm />);

    // Form input should be gone
    expect(screen.queryByRole("textbox")).toBeNull();

    // Success message should be visible
    expect(
      screen.getByText(/sıfırlama bağlantısı e-posta adresinize gönderildi/i)
    ).toBeInTheDocument();
  });

  it("shows submitted email address in success panel", () => {
    mockUseActionState.mockReturnValue([
      {
        success: "Sıfırlama bağlantısı e-posta adresinize gönderildi.",
        fields: { email: "ahmet@example.com" },
      },
      vi.fn(),
      false,
    ] as unknown as ReturnType<typeof useActionState>);

    render(<ForgotPasswordForm />);

    expect(screen.getByText(/ahmet@example\.com/)).toBeInTheDocument();
  });

  it("shows 'Girişe Dön' link in success panel", () => {
    mockUseActionState.mockReturnValue([
      {
        success: "Sıfırlama bağlantısı e-posta adresinize gönderildi.",
        fields: { email: "user@example.com" },
      },
      vi.fn(),
      false,
    ] as unknown as ReturnType<typeof useActionState>);

    render(<ForgotPasswordForm />);

    const loginLinks = screen.getAllByRole("link", { name: /girişe dön/i });
    expect(loginLinks.length).toBeGreaterThan(0);
  });

  it("shows 'Başka E-posta Dene' link in success panel", () => {
    mockUseActionState.mockReturnValue([
      {
        success: "Sıfırlama bağlantısı e-posta adresinize gönderildi.",
        fields: { email: "user@example.com" },
      },
      vi.fn(),
      false,
    ] as unknown as ReturnType<typeof useActionState>);

    render(<ForgotPasswordForm />);

    // Check for the retry link text
    expect(screen.getByRole("link", { name: /başka e-posta dene/i })).toBeInTheDocument();
  });

  it("shows error alert when state.error is set", () => {
    mockUseActionState.mockReturnValue([
      { error: "İşlem şu anda tamamlanamıyor." },
      vi.fn(),
      false,
    ] as unknown as ReturnType<typeof useActionState>);

    render(<ForgotPasswordForm />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    // Use getAllByText to handle potential text splits, or check role="alert" content
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/tamamlanamıyor/i);
    // Form should still be visible on error
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});
