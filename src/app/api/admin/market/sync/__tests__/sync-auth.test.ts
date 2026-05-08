import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAuthContext } from "@/features/auth/lib/session";
import { hasSupabaseAdminEnv } from "@/lib/env";

import { GET } from "../route";

vi.mock("@/features/auth/lib/session", () => ({
  getAuthContext: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
  hasSupabaseEnv: vi.fn(() => true),
}));

const mockDbQuery = {
  select() {
    return this;
  },
  eq() {
    return this;
  },
  not() {
    return this;
  },
  is() {
    return this;
  },
  delete() {
    return this;
  },
  insert() {
    return Promise.resolve({ data: null, error: null });
  },
  maybeSingle() {
    return Promise.resolve({ data: null, error: null });
  },
  then(resolve: (value: { data: unknown[]; error: null }) => void) {
    resolve({ data: [], error: null });
  },
};

vi.mock("@/lib/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from: vi.fn(() => mockDbQuery),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
}));

// Mock logger to avoid spam
vi.mock("@/lib/logger", () => ({
  logger: {
    market: {
      error: vi.fn(),
      info: vi.fn(),
    },
  },
}));

describe("Market Sync Auth", () => {
  const CRON_SECRET = "test-cron-secret";

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.CRON_SECRET = CRON_SECRET;
    vi.mocked(hasSupabaseAdminEnv).mockReturnValue(true);
    vi.mocked(getAuthContext).mockResolvedValue({ user: null, dbProfile: null } as never);
  });

  it("should allow access with valid CRON_SECRET", async () => {
    const req = new Request("http://localhost/api/admin/market/sync", {
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    });

    const res = await GET(req);
    // 401 is unauthorized, any other (like 500 from failed DB mocks) means auth passed
    expect(res.status).not.toBe(401);
  });

  it("should allow access with valid Admin session", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      user: { id: "admin-1", app_metadata: { role: "admin" } },
      dbProfile: { role: "admin", isBanned: false },
    } as never);

    const req = new Request("http://localhost/api/admin/market/sync");
    const res = await GET(req);

    expect(res.status).not.toBe(401);
  });

  it("should deny access with invalid secret and no session", async () => {
    const req = new Request("http://localhost/api/admin/market/sync", {
      headers: { authorization: "Bearer wrong-secret" },
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("should deny access for non-admin users without secret", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      user: { id: "user-1", app_metadata: { role: "user" } },
      dbProfile: { role: "user", isBanned: false },
    } as never);

    const req = new Request("http://localhost/api/admin/market/sync");
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it("should fail-closed if CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;

    const req = new Request("http://localhost/api/admin/market/sync", {
      headers: { authorization: "Bearer any-secret" },
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
