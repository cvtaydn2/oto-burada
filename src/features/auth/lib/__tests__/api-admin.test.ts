/**
 * Bug 10: Admin auth fallback is too trusting
 *
 * Verifies that:
 * - requireApiAdminUser fails closed (503) when admin env is unavailable
 * - isSupabaseAdminUser returns false when admin env is unavailable
 * - Banned admin users are blocked
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockHasSupabaseEnv = vi.fn(() => true);
const mockHasSupabaseAdminEnv = vi.fn(() => true);
const mockGetUser = vi.fn();
const mockProfileSelect = vi.fn();

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: () => mockHasSupabaseEnv(),
  hasSupabaseAdminEnv: () => mockHasSupabaseAdminEnv(),
}));

vi.mock("@/lib/server", () => ({
  createSupabaseServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@/lib/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: mockProfileSelect,
    })),
  })),
}));

vi.mock("@/lib/response", async () => {
  const actual = await vi.importActual<typeof import("@/lib/response")>("@/lib/response");
  return actual;
});

describe("requireApiAdminUser — fail-closed behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasSupabaseEnv.mockReturnValue(true);
    mockHasSupabaseAdminEnv.mockReturnValue(true);
  });

  it("returns 503 when admin env is unavailable (fail closed)", async () => {
    mockHasSupabaseAdminEnv.mockReturnValue(false);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", app_metadata: { role: "admin" } } },
      error: null,
    });

    const { requireApiAdminUser } = await import("../api-admin");
    const result = await requireApiAdminUser();

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(503);
  });

  it("returns 403 when DB profile is missing (fail closed)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", app_metadata: { role: "admin" } } },
      error: null,
    });
    mockProfileSelect.mockResolvedValue({ data: null, error: null });

    const { requireApiAdminUser } = await import("../api-admin");
    const result = await requireApiAdminUser();

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(403);
  });

  it("returns 403 when DB profile role is not admin", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", app_metadata: { role: "admin" } } },
      error: null,
    });
    mockProfileSelect.mockResolvedValue({ data: { role: "user", is_banned: false }, error: null });

    const { requireApiAdminUser } = await import("../api-admin");
    const result = await requireApiAdminUser();

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(403);
  });

  it("returns 403 when admin user is banned", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", app_metadata: { role: "admin" } } },
      error: null,
    });
    mockProfileSelect.mockResolvedValue({ data: { role: "admin", is_banned: true }, error: null });

    const { requireApiAdminUser } = await import("../api-admin");
    const result = await requireApiAdminUser();

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(403);
  });

  it("returns the user when all checks pass", async () => {
    const adminUser = { id: "admin-ok-1", app_metadata: { role: "admin" } };
    mockGetUser.mockResolvedValue({ data: { user: adminUser }, error: null });
    mockProfileSelect.mockResolvedValue({ data: { role: "admin", is_banned: false }, error: null });

    const { requireApiAdminUser } = await import("../api-admin");
    const result = await requireApiAdminUser();

    expect(result).not.toBeInstanceOf(Response);
    expect((result as any).id).toBe("admin-ok-1");
  });
});

describe("isSupabaseAdminUser — fail-closed behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasSupabaseEnv.mockReturnValue(true);
    mockHasSupabaseAdminEnv.mockReturnValue(true);
  });

  it("returns false when admin env is unavailable", async () => {
    mockHasSupabaseAdminEnv.mockReturnValue(false);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", app_metadata: { role: "admin" } } },
    });

    const { isSupabaseAdminUser } = await import("../api-admin");
    const result = await isSupabaseAdminUser();

    expect(result).toBe(false);
  });

  it("returns false when admin user is banned", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", app_metadata: { role: "admin" } } },
    });
    mockProfileSelect.mockResolvedValue({ data: { role: "admin", is_banned: true }, error: null });

    const { isSupabaseAdminUser } = await import("../api-admin");
    const result = await isSupabaseAdminUser();

    expect(result).toBe(false);
  });

  it("returns true when all checks pass", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-ok-2", app_metadata: { role: "admin" } } },
    });
    mockProfileSelect.mockResolvedValue({ data: { role: "admin", is_banned: false }, error: null });

    const { isSupabaseAdminUser } = await import("../api-admin");
    const result = await isSupabaseAdminUser();

    expect(result).toBe(true);
  });
});
