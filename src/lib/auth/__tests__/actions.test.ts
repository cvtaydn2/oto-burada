import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRedirect = vi.fn();
const mockCreateSupabaseServerClient = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockAuthError = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@/lib/analytics/events", () => ({
  AnalyticsEvent: {
    SERVER_AUTH_REGISTER: "SERVER_AUTH_REGISTER",
  },
}));

vi.mock("@/lib/monitoring/posthog-server", () => ({
  identifyServerUser: vi.fn(),
  trackServerEvent: vi.fn(),
}));

vi.mock("@/lib/seo", () => ({
  getAppUrl: vi.fn(() => "https://otoburada.test"),
}));

vi.mock("@/lib/supabase/env", () => ({
  hasSupabaseEnv: vi.fn(() => true),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mockCreateSupabaseServerClient,
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: {
    auth: {
      error: mockAuthError,
    },
  },
}));

vi.mock("@/lib/utils/rate-limit", () => ({
  rateLimitProfiles: {
    auth: {},
  },
}));

vi.mock("@/lib/utils/rate-limit-middleware", () => ({
  checkRateLimit: mockCheckRateLimit,
}));

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
  });

  it("preserves fullName in register validation errors", async () => {
    const { registerAction } = await import("../actions");

    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("fullName", "Test User");
    formData.set("password", "1234567");

    const result = await registerAction(undefined, formData);

    expect(result.fields?.email).toBe("test@example.com");
    expect(result.fields?.fullName).toBe("Test User");
  });

  it("uses the real reset-password route in forgot password flow", async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
    mockCreateSupabaseServerClient.mockResolvedValue({
      auth: {
        resetPasswordForEmail,
      },
    });

    const { forgotPasswordAction } = await import("../actions");

    const formData = new FormData();
    formData.set("email", "test@example.com");

    const result = await forgotPasswordAction(undefined, formData);

    expect(resetPasswordForEmail).toHaveBeenCalledWith("test@example.com", {
      redirectTo: "https://otoburada.test/reset-password",
    });
    expect(result.success).toContain("Sıfırlama bağlantısı");
  });

  it("returns a generic error and logs dispatch failures in forgot password flow", async () => {
    const providerError = new Error("smtp failed");
    mockCreateSupabaseServerClient.mockResolvedValue({
      auth: {
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: providerError }),
      },
    });

    const { forgotPasswordAction } = await import("../actions");

    const formData = new FormData();
    formData.set("email", "test@example.com");

    const result = await forgotPasswordAction(undefined, formData);

    expect(result.error).toBe("İşlem şu anda tamamlanamıyor. Lütfen biraz sonra tekrar dene.");
    expect(result.fields?.email).toBe("test@example.com");
    // Fix 3: Log now uses sanitized reason code, not raw error or PII
    expect(mockAuthError).toHaveBeenCalledWith(
      "Forgot password email dispatch failed",
      { reason: "provider_error" },
      {}
    );
  });
});
