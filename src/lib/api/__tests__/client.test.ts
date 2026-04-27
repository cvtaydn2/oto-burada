/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unit tests for API Client
 * Tests BUG-04: JSON Parse Error Handling
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClient } from "../client";

describe("ApiClient", () => {
  beforeEach(() => {
    // Mock fetch globally
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("BUG-04: JSON Parse Error Handling", () => {
    it("should handle JSON parse errors gracefully", async () => {
      // Mock fetch to return invalid JSON
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error("Unexpected token")),
      });

      const result = await ApiClient.request("/api/test");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("PARSE_ERROR");
      expect(result.error?.message).toContain("JSON parse hatası");
    });

    it("should handle valid JSON responses", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { id: "123", name: "Test" } }),
      });

      const result = await ApiClient.request("/api/test");

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: "123", name: "Test" });
    });

    it("should handle empty response body", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await ApiClient.request("/api/test");

      expect(result.success).toBe(true);
    });

    it("should handle network errors", async () => {
      (global.fetch as any).mockRejectedValue(new Error("Network error"));

      const result = await ApiClient.request("/api/test");

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("Network error");
    });

    it("should handle 401 errors without redirect in non-browser environment", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: "Unauthorized" } }),
      });

      const result = await ApiClient.request("/api/test");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("UNAUTHORIZED");
    });

    it("should handle error responses with JSON parse failure", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      const result = await ApiClient.request("/api/test");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("PARSE_ERROR");
    });
  });

  describe("CSRF Token Injection", () => {
    it("should inject CSRF token from cookie", async () => {
      // Mock document.cookie
      Object.defineProperty(document, "cookie", {
        writable: true,
        value: "csrf_token=test-token-123",
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      });

      await ApiClient.request("/api/test");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/test",
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-csrf-token": "test-token-123",
          }),
        })
      );
    });

    it("should work without CSRF token", async () => {
      Object.defineProperty(document, "cookie", {
        writable: true,
        value: "",
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      });

      await ApiClient.request("/api/test");

      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
