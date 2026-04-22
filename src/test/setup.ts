import "@testing-library/jest-dom";

import { vi } from "vitest";

// Mock Next.js headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
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

// Mock Supabase Admin
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

// Mock Supabase Server
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() =>
    Promise.resolve({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation((num) => {
          if (num === 20) return Promise.resolve({ data: [{ id: 1, name: "BMW" }], error: null });
          if (num === 10) return Promise.resolve({ data: [{ name: "320i" }], error: null });
          return Promise.resolve({ data: [], error: null });
        }),
      })),
    })
  ),
}));

// Mock Supabase Env
vi.mock("@/lib/supabase/env", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
  getSupabaseAdminEnv: vi.fn(() => ({
    url: "https://example.supabase.co",
    serviceRoleKey: "mock-key",
  })),
}));
