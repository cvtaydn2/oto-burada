/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { isSupabaseAdminUser } from "@/lib/auth/api-admin";
import { getCurrentUser } from "@/lib/auth/session";
import { isValidRequestOrigin } from "@/lib/security";

import { withAdminRoute, withCronOrAdmin, withUserAndCsrf, withUserRoute } from "../api-security";

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/auth/api-admin", () => ({
  isSupabaseAdminUser: vi.fn(),
}));

vi.mock("@/lib/security", () => ({
  isValidRequestOrigin: vi.fn(),
}));

vi.mock("@/lib/utils/rate-limit-middleware", () => ({
  enforceRateLimit: vi.fn(() => null), // null means no limit hit
  getRateLimitKey: vi.fn(() => "test-key"),
  getUserRateLimitKey: vi.fn(() => "test-user-key"),
}));

describe("API Security Wrappers", () => {
  const mockUser = { id: "user-1" } as any;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(isValidRequestOrigin).mockReturnValue(true);
  });

  it("withUserRoute should require authentication", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const req = new Request("http://localhost/api/test");
    const result = await withUserRoute(req);
    expect(result.ok).toBe(false);
    expect((result as any).response.status).toBe(401);
  });

  it("withUserAndCsrf should require both auth and valid origin", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(isValidRequestOrigin).mockReturnValue(false);

    const req = new Request("http://localhost/api/test", { method: "POST" });
    const result = await withUserAndCsrf(req);

    expect(result.ok).toBe(false);
    expect((result as any).response.status).toBe(403);
  });

  it("withAdminRoute should require admin role", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(isSupabaseAdminUser).mockResolvedValue(false);

    const req = new Request("http://localhost/api/admin/test");
    const result = await withAdminRoute(req);

    expect(result.ok).toBe(false);
    expect((result as any).response.status).toBe(403);
  });

  it("withCronOrAdmin should allow access with valid Cron secret", async () => {
    process.env.CRON_SECRET = "secret-123";
    const req = new Request("http://localhost/api/sync", {
      headers: { authorization: "Bearer secret-123" },
    });

    const result = await withCronOrAdmin(req);
    expect(result.ok).toBe(true);
  });

  it("withCronOrAdmin should fall back to admin session if no secret", async () => {
    process.env.CRON_SECRET = "secret-123";
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(isSupabaseAdminUser).mockResolvedValue(true);

    const req = new Request("http://localhost/api/sync");
    const result = await withCronOrAdmin(req);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user).toBeDefined();
    }
  });
});
