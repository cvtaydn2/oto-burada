import type { User } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { checkApiSecurity } from "../api-security";
import { handleAuthRedirects } from "../auth";

describe("Middleware Logic - Auth Redirects", () => {
  const factory = (path: string) => {
    const url = new URL(`http://localhost${path}`);
    return new NextRequest(url);
  };

  it("should redirect unauthenticated users from /dashboard to /login", () => {
    const req = factory("/dashboard");
    const res = handleAuthRedirects(req, null, {
      isProtectedRoute: true,
      isAdminRoute: false,
      isAuthRoute: false,
      isProtectedApi: false,
      isAdminApi: false,
    });

    expect(res?.status).toBe(307); // Next.js temporary redirect
    expect(res?.headers.get("location")).toContain("/login?next=%2Fdashboard");
  });

  it("should redirect non-admin users from /admin to /dashboard", () => {
    const req = factory("/admin/users");
    const mockUser = { id: "1", app_metadata: { role: "user" } } as unknown as User;
    const res = handleAuthRedirects(req, mockUser, {
      isProtectedRoute: true,
      isAdminRoute: true,
      isAuthRoute: false,
      isProtectedApi: false,
      isAdminApi: false,
    });

    expect(res?.status).toBe(307);
    expect(res?.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("should allow admin users on /admin", () => {
    const req = factory("/admin/users");
    const mockUser = { id: "1", app_metadata: { role: "admin" } } as unknown as User;
    const res = handleAuthRedirects(req, mockUser, {
      isProtectedRoute: true,
      isAdminRoute: true,
      isAuthRoute: false,
      isProtectedApi: false,
      isAdminApi: false,
    });

    expect(res).toBeNull(); // No redirect
  });

  it("should redirect authenticated users from /login to /dashboard", () => {
    const req = factory("/login");
    const mockUser = { id: "1" } as unknown as User;
    const res = handleAuthRedirects(req, mockUser, {
      isProtectedRoute: false,
      isAdminRoute: false,
      isAuthRoute: true,
      isProtectedApi: false,
      isAdminApi: false,
    });

    expect(res?.status).toBe(307);
    expect(res?.headers.get("location")).toBe("http://localhost/dashboard");
  });
});

describe("Middleware Logic - API Security", () => {
  it("should block POST requests with origin mismatch in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://otoburada.com");

    const req = new NextRequest(new URL("https://otoburada.com/api/test"), {
      method: "POST",
      headers: { origin: "https://evil.com" },
    });

    const result = checkApiSecurity(req);
    expect(result.isValid).toBe(false);
    expect(result.response?.status).toBe(403);

    vi.unstubAllEnvs();
  });

  it("should allow matching origins in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://otoburada.com");

    const req = new NextRequest(new URL("https://otoburada.com/api/test"), {
      method: "POST",
      headers: { origin: "https://otoburada.com" },
    });

    const result = checkApiSecurity(req);
    expect(result.isValid).toBe(true);

    vi.unstubAllEnvs();
  });
});
