/**
 * Unit tests for the in-memory rate limit fallback tier.
 * Redis and Supabase tiers are mocked out so we test the fallback logic directly.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Redis as unavailable (null) to force in-memory fallback
vi.mock("@/features/shared/lib", () => ({ redis: null }));

// Mock Supabase as unavailable to force in-memory fallback
vi.mock("@/features/shared/lib/env", () => ({
  hasSupabaseAdminEnv: vi.fn(() => false),
}));

vi.mock("@/features/shared/lib/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/features/shared/lib/logger", () => ({
  logger: {
    api: { warn: vi.fn(), error: vi.fn() },
    db: { warn: vi.fn() },
  },
}));

import { checkRateLimit } from "@/features/shared/lib/rate-limit";

describe("checkRateLimit — in-memory fallback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("allows first request", async () => {
    const result = await checkRateLimit("test-key-1", { limit: 5, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.limit).toBe(5);
  });

  it("allows requests up to the limit", async () => {
    const key = "test-key-2";
    const config = { limit: 3, windowMs: 60_000 };

    const r1 = await checkRateLimit(key, config);
    const r2 = await checkRateLimit(key, config);
    const r3 = await checkRateLimit(key, config);

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks the request that exceeds the limit", async () => {
    const key = "test-key-3";
    const config = { limit: 2, windowMs: 60_000 };

    await checkRateLimit(key, config); // 1
    await checkRateLimit(key, config); // 2
    const r3 = await checkRateLimit(key, config); // 3 — over limit

    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it("resets counter after window expires", async () => {
    const key = "test-key-4";
    const config = { limit: 1, windowMs: 1_000 };

    const r1 = await checkRateLimit(key, config);
    expect(r1.allowed).toBe(true);

    const r2 = await checkRateLimit(key, config);
    expect(r2.allowed).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(1_100);

    const r3 = await checkRateLimit(key, config);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("returns correct resetAt timestamp", async () => {
    const now = Date.now();
    const windowMs = 60_000;
    const result = await checkRateLimit("test-key-5", { limit: 10, windowMs });

    expect(result.resetAt).toBeGreaterThanOrEqual(now + windowMs - 100);
    expect(result.resetAt).toBeLessThanOrEqual(now + windowMs + 100);
  });

  it("isolates different keys independently", async () => {
    const config = { limit: 1, windowMs: 60_000 };

    const rA = await checkRateLimit("key-a", config);
    const rB = await checkRateLimit("key-b", config);

    expect(rA.allowed).toBe(true);
    expect(rB.allowed).toBe(true);

    const rA2 = await checkRateLimit("key-a", config);
    const rB2 = await checkRateLimit("key-b", config);

    expect(rA2.allowed).toBe(false);
    expect(rB2.allowed).toBe(false);
  });
});
