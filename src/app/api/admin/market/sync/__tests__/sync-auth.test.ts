import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";
import { isSupabaseAdminUser } from "@/lib/auth/api-admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/auth/session";

vi.mock("@/lib/auth/api-admin", () => ({
  isSupabaseAdminUser: vi.fn(),
  requireApiAdminUser: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
  hasSupabaseEnv: vi.fn(() => true),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        maybeSingleAndMore: vi.fn(), // for future
      })),
    })),
  })),
}));

// Mock logger to avoid spam
vi.mock("@/lib/utils/logger", () => ({
  logger: {
    market: {
      error: vi.fn(),
      info: vi.fn(),
    }
  }
}));

describe("Market Sync Auth", () => {
  const CRON_SECRET = "test-cron-secret";
  
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.CRON_SECRET = CRON_SECRET;
    vi.mocked(hasSupabaseAdminEnv).mockReturnValue(true);
    vi.mocked(getCurrentUser).mockResolvedValue(null);
  });

  it("should allow access with valid CRON_SECRET", async () => {
    const req = new Request("http://localhost/api/admin/market/sync", {
      headers: { authorization: `Bearer ${CRON_SECRET}` }
    });
    
    const res = await GET(req);
    // 401 is unauthorized, any other (like 500 from failed DB mocks) means auth passed
    expect(res.status).not.toBe(401);
  });

  it("should allow access with valid Admin session", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "admin-1",
      app_metadata: { role: "admin" },
    } as never);
    vi.mocked(isSupabaseAdminUser).mockResolvedValue(true);
    
    const req = new Request("http://localhost/api/admin/market/sync");
    const res = await GET(req);
    
    expect(res.status).not.toBe(401);
  });

  it("should deny access with invalid secret and no session", async () => {
    vi.mocked(isSupabaseAdminUser).mockResolvedValue(false);

    const req = new Request("http://localhost/api/admin/market/sync", {
      headers: { authorization: "Bearer wrong-secret" }
    });
    
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("should deny access for non-admin users without secret", async () => {
    vi.mocked(isSupabaseAdminUser).mockResolvedValue(false);
    
    const req = new Request("http://localhost/api/admin/market/sync");
    const res = await GET(req);
    
    expect(res.status).toBe(401);
  });

  it("should fail-closed if CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    vi.mocked(isSupabaseAdminUser).mockResolvedValue(false);

    const req = new Request("http://localhost/api/admin/market/sync", {
      headers: { authorization: "Bearer any-secret" }
    });
    
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
