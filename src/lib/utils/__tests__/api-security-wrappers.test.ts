/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  withAdminRoute,
  withCronOrAdmin,
  withUserAndCsrf,
  withUserRoute,
} from "@/lib/api/security";
import { getAuthContext } from "@/lib/auth/session";
import { isValidRequestOrigin } from "@/lib/security";
import { validateCsrfToken } from "@/lib/security/csrf";

vi.mock("@/lib/auth/session", () => ({
  getAuthContext: vi.fn(),
}));

vi.mock("@/lib/security", () => ({
  isValidRequestOrigin: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  validateCsrfToken: vi.fn(() => true),
}));

vi.mock("@/lib/rate-limiting/rate-limit-middleware", () => ({
  enforceRateLimit: vi.fn(() => null), // null means no limit hit
  getRateLimitKey: vi.fn(() => "test-key"),
  getUserRateLimitKey: vi.fn(() => "test-user-key"),
}));

describe("API Security Wrappers", () => {
  const mockUser = { id: "user-1" } as any;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(isValidRequestOrigin).mockReturnValue(true);
    vi.mocked(validateCsrfToken).mockResolvedValue(true);
  });

  it("withUserRoute should require authentication", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ user: null, dbProfile: null } as never);
    const req = new Request("http://localhost/api/test");
    const result = await withUserRoute(req);
    expect(result.ok).toBe(false);
    expect((result as any).response.status).toBe(401);
  });

  it("withUserAndCsrf should require both auth and valid origin", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      user: mockUser,
      dbProfile: { role: "user", isBanned: false },
    } as never);
    vi.mocked(isValidRequestOrigin).mockReturnValue(false);

    const req = new Request("http://localhost/api/test", { method: "POST" });
    const result = await withUserAndCsrf(req);

    expect(result.ok).toBe(false);
    expect((result as any).response.status).toBe(403);
  });

  it("withAdminRoute should require admin role", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      user: mockUser,
      dbProfile: { role: "user", isBanned: false },
    } as never);

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
    vi.mocked(getAuthContext).mockResolvedValue({
      user: mockUser,
      dbProfile: { role: "admin", isBanned: false },
    } as never);

    const req = new Request("http://localhost/api/sync");
    const result = await withCronOrAdmin(req);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user).toBeDefined();
    }
  });
});
