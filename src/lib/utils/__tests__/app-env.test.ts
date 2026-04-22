import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAppEnvironment, getBaseUrl } from "../app-env";

describe("App Environment Utilities", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  describe("getAppEnvironment", () => {
    it("should return production when VERCEL_ENV is production", () => {
      vi.stubEnv("VERCEL_ENV", "production");
      expect(getAppEnvironment()).toBe("production");
    });

    it("should return preview when VERCEL_ENV is preview", () => {
      vi.stubEnv("VERCEL_ENV", "preview");
      expect(getAppEnvironment()).toBe("preview");
    });

    it("should fallback to development", () => {
      vi.stubEnv("VERCEL_ENV", "");
      vi.stubEnv("NODE_ENV", "development");
      expect(getAppEnvironment()).toBe("development");
    });
  });

  describe("getBaseUrl", () => {
    it("should return SITE_URL if defined (highest priority)", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
      expect(getBaseUrl()).toBe("https://example.com");
    });

    it("should return VERCEL_URL if defined (preview priority)", () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      process.env.NEXT_PUBLIC_VERCEL_URL = "project.vercel.app";
      expect(getBaseUrl()).toBe("https://project.vercel.app");
    });

    it("should fallback to localhost", () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      expect(getBaseUrl()).toBe("http://localhost:3000");
    });
  });
});
