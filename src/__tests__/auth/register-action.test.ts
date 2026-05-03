/**
 * Tests: registerAction — success path fullName → signUp metadata chain
 * Risk: fullName form → action → Supabase signUp metadata zinciri tekrar kırılabilir.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Must mock before importing the action (server-only modules)
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("@/lib/monitoring/telemetry-server", () => ({
  trackServerEvent: vi.fn(),
  identifyServerUser: vi.fn(),
}));

vi.mock("@/lib/rate-limiting/rate-limit-middleware", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));

vi.mock("@/lib/rate-limiting/rate-limit", () => ({
  rateLimitProfiles: { auth: {} },
}));

vi.mock("@/lib/security/turnstile", () => ({
  isTurnstileEnabled: vi.fn(() => false),
  verifyTurnstileToken: vi.fn(),
}));

vi.mock("@/lib/seo", () => ({
  getAppUrl: vi.fn(() => "https://otoburada.com"),
}));

const mockSignUp = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        signUp: mockSignUp,
        getUser: mockGetUser,
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: "profile-1" }, error: null }),
      })),
    })
  ),
}));

vi.mock("@/lib/supabase/env", () => ({
  hasSupabaseEnv: vi.fn(() => true),
}));

import { registerAction } from "@/lib/auth/actions";

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
}

describe("registerAction — success path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes fullName as full_name in signUp options.data", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: "uid-1", email: "test@example.com" }, session: null },
      error: null,
    });

    const fd = makeFormData({
      email: "test@example.com",
      password: "password123",
      fullName: "Ahmet Yılmaz",
    });

    const result = await registerAction(null, fd);

    expect(mockSignUp).toHaveBeenCalledOnce();
    const callArgs = mockSignUp.mock.calls[0][0] as {
      options: { data: { full_name: string } };
    };
    expect(callArgs.options.data.full_name).toBe("Ahmet Yılmaz");
    expect(result?.success).toBe(true);
    expect(result?.error).toBeUndefined();
  });

  it("returns success message when no session (email confirmation flow)", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: "uid-2", email: "test@example.com" }, session: null },
      error: null,
    });

    const fd = makeFormData({
      email: "test@example.com",
      password: "password123",
      fullName: "Fatma Kaya",
    });

    const result = await registerAction(null, fd);

    expect(result?.message).toContain("Hesabın oluşturuldu");
    expect(result?.fields?.email).toBe("test@example.com");
    expect(result?.fields?.fullName).toBe("Fatma Kaya");
  });

  it("redirects to /dashboard when session is immediately available", async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: { id: "uid-3", email: "test@example.com" },
        session: { access_token: "tok" },
      },
      error: null,
    });

    const fd = makeFormData({
      email: "test@example.com",
      password: "password123",
      fullName: "Ali Demir",
    });

    await expect(registerAction(null, fd)).rejects.toThrow("REDIRECT:/dashboard");
  });

  it("returns error state when Supabase signUp fails", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "User already registered" },
    });

    const fd = makeFormData({
      email: "existing@example.com",
      password: "password123",
      fullName: "Mevcut Kullanıcı",
    });

    const result = await registerAction(null, fd);

    expect(result?.error).toBeDefined();
    expect(result?.success).toBe(false);
    // Fields should be preserved for form re-population
    expect(result?.fields?.email).toBe("existing@example.com");
    expect(result?.fields?.fullName).toBe("Mevcut Kullanıcı");
  });

  it("returns validation error when fullName is too short", async () => {
    const fd = makeFormData({
      email: "test@example.com",
      password: "password123",
      fullName: "Al",
    });

    const result = await registerAction(null, fd);

    expect(result?.error).toBeDefined();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("returns rate-limit error when rate limit is exceeded", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limiting/rate-limit-middleware");
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      limit: 5,
      resetAt: Date.now() + 60000,
    });

    const fd = makeFormData({
      email: "test@example.com",
      password: "password123",
      fullName: "Test Kullanıcı",
    });

    const result = await registerAction(null, fd);

    expect(result?.error).toContain("Çok fazla kayıt denemesi");
    expect(mockSignUp).not.toHaveBeenCalled();
  });
});
