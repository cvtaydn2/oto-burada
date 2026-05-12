import "@testing-library/jest-dom/vitest";

import { vi } from "vitest";

function createMockResult<T>(data: T = null as T) {
  return Promise.resolve({ data, error: null, count: null, status: 200, statusText: "OK" });
}

function createQueryBuilder() {
  const builder = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    gt: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    lt: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    like: vi.fn(() => builder),
    ilike: vi.fn(() => builder),
    is: vi.fn(() => builder),
    in: vi.fn(() => builder),
    contains: vi.fn(() => builder),
    overlap: vi.fn(() => builder),
    match: vi.fn(() => builder),
    or: vi.fn(() => builder),
    not: vi.fn(() => builder),
    filter: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    range: vi.fn(() => builder),
    single: vi.fn(() => createMockResult(null)),
    maybeSingle: vi.fn(() => createMockResult(null)),
    returns: vi.fn(() => builder),
    then: vi.fn((onFulfilled) => createMockResult([]).then(onFulfilled)),
    catch: vi.fn((onRejected) => createMockResult([]).catch(onRejected)),
    finally: vi.fn((onFinally) => createMockResult([]).finally(onFinally)),
  };

  return builder;
}

function createSupabaseMockClient() {
  return {
    from: vi.fn(() => createQueryBuilder()),
    rpc: vi.fn(() => createMockResult(null)),
    auth: {
      getUser: vi.fn(() => createMockResult({ user: null })),
      getSession: vi.fn(() => createMockResult({ session: null })),
      signOut: vi.fn(() => createMockResult(null)),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => createMockResult({ path: "mock-path" })),
        remove: vi.fn(() => createMockResult([])),
        createSignedUrl: vi.fn(() => createMockResult({ signedUrl: "https://example.com/mock" })),
      })),
    },
  };
}

// Prevent Next.js server boundary module from crashing Vitest module loading.
vi.mock("server-only", () => ({}));

// Mock Next.js headers
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

// Mock Supabase Admin
vi.mock("@/lib/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => createSupabaseMockClient()),
}));

// Mock Supabase Server
vi.mock("@/lib/server", () => ({
  createSupabaseServerClient: vi.fn(() => Promise.resolve(createSupabaseMockClient())),
}));

// Mock Supabase Env
vi.mock("@/lib/env", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
  hasSupabaseEnv: vi.fn(() => true),
  getSupabaseAdminEnv: vi.fn(() => ({
    url: "https://example.supabase.co",
    serviceRoleKey: "mock-key",
  })),
  getSupabaseEnv: vi.fn(() => ({
    url: "https://example.supabase.co",
    anonKey: "mock-anon-key",
  })),
}));
