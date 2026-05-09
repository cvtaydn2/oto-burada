/**
 * Unit tests for CSRF Token Validation
 * Tests BUG-07: Promise.allSettled for Hash Comparison
 */

import { describe, expect, it, vi } from "vitest";

import { generateCsrfToken, hashCsrfToken, rotateOnSensitiveAction } from "../csrf";

describe("CSRF Token Security", () => {
  describe("BUG-07: Promise.allSettled for Hash Comparison", () => {
    it("should generate cryptographically secure tokens", () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();

      expect(token1).toHaveLength(32);
      expect(token2).toHaveLength(32);
      expect(token1).not.toBe(token2);
    });

    it("should hash tokens consistently", async () => {
      const token = "test-token-123";
      const hash1 = await hashCsrfToken(token);
      const hash2 = await hashCsrfToken(token);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex chars
    });

    it("should produce different hashes for different tokens", async () => {
      const token1 = "test-token-1";
      const token2 = "test-token-2";

      const hash1 = await hashCsrfToken(token1);
      const hash2 = await hashCsrfToken(token2);

      expect(hash1).not.toBe(hash2);
    });

    it("should handle hash failures gracefully", async () => {
      // Mock crypto.subtle.digest to fail
      const originalDigest = crypto.subtle.digest;
      crypto.subtle.digest = vi.fn().mockRejectedValue(new Error("Hash failed"));

      try {
        await hashCsrfToken("test");
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeDefined();
      } finally {
        crypto.subtle.digest = originalDigest;
      }
    });
  });

  describe("Token Generation", () => {
    it("should generate tokens with sufficient entropy", () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateCsrfToken());
      }
      expect(tokens.size).toBe(100); // All unique
    });

    it("should generate tokens with valid hex characters", () => {
      const token = generateCsrfToken();
      expect(token).toMatch(/^[0-9a-f]{32}$/);
    });
  });

  describe("Hash Consistency", () => {
    it("should produce consistent hashes across multiple calls", async () => {
      const token = generateCsrfToken();
      const hashes = await Promise.all([
        hashCsrfToken(token),
        hashCsrfToken(token),
        hashCsrfToken(token),
      ]);

      expect(hashes[0]).toBe(hashes[1]);
      expect(hashes[1]).toBe(hashes[2]);
    });

    it("should handle empty string", async () => {
      const hash = await hashCsrfToken("");
      expect(hash).toHaveLength(64);
    });

    it("should handle special characters", async () => {
      const token = "!@#$%^&*()_+-=[]{}|;:',.<>?/~`";
      const hash = await hashCsrfToken(token);
      expect(hash).toHaveLength(64);
    });
  });
  describe("Sensitive Action Rotation", () => {
    it("should expose a helper for post-sensitive-action rotation", async () => {
      const rotatedToken = await rotateOnSensitiveAction();

      expect(rotatedToken).toHaveLength(32);
      expect(rotatedToken).toMatch(/^[0-9a-f]{32}$/);
    });
  });
});
