/**
 * Bug 3: Wrong HTTP status mapping in POST /api/listings
 *
 * Verifies that each error code from executeListingCreation maps to the
 * correct HTTP status code.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { withUserAndCsrfToken } from "@/lib/security";

vi.mock("@/lib/security", () => ({
  withUserAndCsrfToken: vi.fn(),
  withSecurity: vi.fn(),
}));

vi.mock("@/lib/turnstile", () => ({
  verifyTurnstileToken: vi.fn(() => Promise.resolve(true)),
}));

vi.mock("@/lib/handler-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/handler-utils")>();
  return {
    ...actual,
    validateRequestBody: vi.fn(async () => ({
      success: true,
      data: { turnstileToken: "test-token" },
    })),
  };
});

vi.mock("@/lib/rate-limit", () => ({
  rateLimitProfiles: { general: {}, listingCreate: {} },
}));

vi.mock("@/lib/rate-limit-middleware", () => ({
  enforceRateLimit: vi.fn(() => null),
  getRateLimitKey: vi.fn(() => "key"),
}));

vi.mock("@/lib/telemetry-server", () => ({
  captureServerError: vi.fn(),
  trackServerEvent: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { listings: { error: vi.fn(), info: vi.fn() }, system: { error: vi.fn() } },
}));

vi.mock("@vercel/functions", () => ({ waitUntil: vi.fn() }));

vi.mock("@/features/marketplace/services/listing-filters", () => ({
  parseListingFiltersFromSearchParams: vi.fn(() => ({})),
}));

vi.mock("@/features/marketplace/services/marketplace-listings", () => ({
  getFilteredMarketplaceListings: vi.fn(() => ({ listings: [] })),
}));

vi.mock("@/features/marketplace/services/listing-limits", () => ({
  checkListingLimit: vi.fn(),
}));

vi.mock("@/features/marketplace/services/listing-submission-moderation", () => ({
  performAsyncModeration: vi.fn(),
  runListingTrustGuards: vi.fn(),
}));

vi.mock("@/features/marketplace/services/listing-submissions", () => ({
  createDatabaseListing: vi.fn(),
}));

vi.mock("@/features/notifications/services/notification-records", () => ({
  createDatabaseNotification: vi.fn(),
}));

const mockExecuteListingCreation = vi.fn();
vi.mock("@/domain/usecases/listing-create", () => ({
  executeListingCreation: (...args: unknown[]) => mockExecuteListingCreation(...args),
}));

const mockUser = { id: "user-1" };

function makePostRequest(body: unknown = {}) {
  return new Request("http://localhost/api/listings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/listings — HTTP status mapping", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(withUserAndCsrfToken).mockResolvedValue({ ok: true, user: mockUser } as any);
  });

  it("returns 400 for VALIDATION_ERROR", async () => {
    mockExecuteListingCreation.mockResolvedValue({
      success: false,
      errorCode: "VALIDATION_ERROR",
      error: "Geçersiz veri.",
    });

    const { POST } = await import("../route");
    const res = await POST(makePostRequest());
    expect(res.status).toBe(400);
  });

  it("returns 409 for SLUG_COLLISION", async () => {
    mockExecuteListingCreation.mockResolvedValue({
      success: false,
      errorCode: "SLUG_COLLISION",
      error: "Slug çakışması.",
    });

    const { POST } = await import("../route");
    const res = await POST(makePostRequest());
    expect(res.status).toBe(409);
  });

  it("returns 403 for QUOTA_EXCEEDED", async () => {
    mockExecuteListingCreation.mockResolvedValue({
      success: false,
      errorCode: "QUOTA_EXCEEDED",
      error: "Kota aşıldı.",
    });

    const { POST } = await import("../route");
    const res = await POST(makePostRequest());
    expect(res.status).toBe(403);
  });

  it("returns 403 for TRUST_GUARD_REJECTION", async () => {
    mockExecuteListingCreation.mockResolvedValue({
      success: false,
      errorCode: "TRUST_GUARD_REJECTION",
      error: "Güven ihlali.",
    });

    const { POST } = await import("../route");
    const res = await POST(makePostRequest());
    expect(res.status).toBe(403);
  });

  it("returns 500 for DB_ERROR", async () => {
    mockExecuteListingCreation.mockResolvedValue({
      success: false,
      errorCode: "DB_ERROR",
      error: "Veritabanı hatası.",
    });

    const { POST } = await import("../route");
    const res = await POST(makePostRequest());
    expect(res.status).toBe(500);
  });

  it("returns 201 on success", async () => {
    mockExecuteListingCreation.mockResolvedValue({
      success: true,
      listing: { id: "listing-1", slug: "bmw-320i", status: "pending" },
    });

    const { POST } = await import("../route");
    const res = await POST(makePostRequest());
    expect(res.status).toBe(201);
  });
});
