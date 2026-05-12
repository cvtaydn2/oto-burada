import { vi } from "vitest";

// Integration tests import server modules directly; avoid boundary errors in Vitest.
vi.mock("server-only", () => ({}));

// Some services read request headers; provide a stable mock in test runtime.
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    getAll: vi.fn(() => []),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() =>
    Promise.resolve({
      get: vi.fn((key: string) => {
        if (key === "x-forwarded-for") return "127.0.0.1";
        if (key === "x-real-ip") return "127.0.0.1";
        return null;
      }),
    })
  ),
}));

vi.mock("@/lib/env", async () => {
  const actual = await vi.importActual<typeof import("../lib/supabase/env")>("../lib/supabase/env");
  return {
    ...actual,
    hasSupabaseEnv: vi.fn(() => true),
    hasSupabaseAdminEnv: vi.fn(() => true),
    getSupabaseEnv: vi.fn(() => ({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co",
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "mock-anon-key",
    })),
    getSupabaseAdminEnv: vi.fn(() => ({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co",
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "mock-service-role",
    })),
  };
});
