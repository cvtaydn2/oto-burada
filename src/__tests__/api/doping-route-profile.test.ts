/**
 * Tests: Doping route — missing buyer profile fields fail-closed
 * Risk: phone/address/city/zip eksik profile ile ödeme tekrar açılabilir.
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── All mocks use vi.hoisted to avoid hoisting issues ─────────────────────────
const { mockWithUserAndCsrf } = vi.hoisted(() => ({
  mockWithUserAndCsrf: vi.fn().mockResolvedValue({
    ok: true,
    user: { id: "user-123", email: "seller@example.com" },
  }),
}));

vi.mock("@/lib/utils/api-security", () => ({
  withUserAndCsrf: mockWithUserAndCsrf,
}));

const { mockEnforceRateLimit } = vi.hoisted(() => ({
  mockEnforceRateLimit: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/utils/rate-limit-middleware", () => ({
  enforceRateLimit: mockEnforceRateLimit,
  getUserRateLimitKey: vi.fn((userId: string, key: string) => `${userId}:${key}`),
}));

// ── Monitoring stubs ───────────────────────────────────────────────────────────
vi.mock("@/lib/monitoring/posthog-server", () => ({
  captureServerEvent: vi.fn(),
  captureServerError: vi.fn(),
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: {
    payments: { error: vi.fn() },
  },
}));

// ── Listing service stub ───────────────────────────────────────────────────────
const { mockGetDatabaseListings } = vi.hoisted(() => ({
  mockGetDatabaseListings: vi
    .fn()
    .mockResolvedValue([{ id: "listing-abc", status: "active", seller_id: "user-123" }]),
}));

vi.mock("@/services/listings/listing-submissions", () => ({
  getDatabaseListings: mockGetDatabaseListings,
}));

// ── Profile service stub ───────────────────────────────────────────────────────
const { mockGetUserProfile } = vi.hoisted(() => ({
  mockGetUserProfile: vi.fn(),
}));

vi.mock("@/services/profile/profile-records", () => ({
  getUserProfile: mockGetUserProfile,
}));

// ── Doping service stub ────────────────────────────────────────────────────────
const { mockApplyDopingToListing } = vi.hoisted(() => ({
  mockApplyDopingToListing: vi.fn().mockResolvedValue({ success: true, message: "OK" }),
}));

vi.mock("@/services/market/doping-service", () => ({
  applyDopingToListing: mockApplyDopingToListing,
}));

import { POST } from "@/app/api/listings/[id]/doping/route";

const TEST_USER = { id: "user-123", email: "seller@example.com" };

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/listings/listing-abc/doping", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const params = Promise.resolve({ id: "listing-abc" });

describe("Doping route — missing buyer profile fields (fail-closed)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWithUserAndCsrf.mockResolvedValue({ ok: true, user: TEST_USER });
    mockEnforceRateLimit.mockResolvedValue(null);
    mockGetDatabaseListings.mockResolvedValue([
      { id: "listing-abc", status: "active", seller_id: "user-123" },
    ]);
  });

  it("returns 400 when profile is null", async () => {
    mockGetUserProfile.mockResolvedValue(null);

    const res = await POST(makeRequest({ dopingTypes: ["featured"] }), { params });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.message).toMatch(/profil bilgileriniz/i);
  });

  it("returns 400 when fullName is missing", async () => {
    mockGetUserProfile.mockResolvedValue({
      fullName: "",
      taxId: "12345678901",
      phone: "+905001234567",
      businessAddress: "Atatürk Cad. No:1 34000",
      city: "İstanbul",
      createdAt: new Date().toISOString(),
    });

    const res = await POST(makeRequest({ dopingTypes: ["featured"] }), { params });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("returns 400 when taxId (identityNumber) is missing or invalid", async () => {
    mockGetUserProfile.mockResolvedValue({
      fullName: "Ahmet Yılmaz",
      taxId: null,
      phone: "+905001234567",
      businessAddress: "Atatürk Cad. No:1 34000",
      city: "İstanbul",
      createdAt: new Date().toISOString(),
    });

    const res = await POST(makeRequest({ dopingTypes: ["featured"] }), { params });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.message).toMatch(/TC Kimlik/i);
  });

  it("returns 400 when taxId is not 11 digits", async () => {
    mockGetUserProfile.mockResolvedValue({
      fullName: "Ahmet Yılmaz",
      taxId: "1234",
      phone: "+905001234567",
      businessAddress: "Atatürk Cad. No:1 34000",
      city: "İstanbul",
      createdAt: new Date().toISOString(),
    });

    const res = await POST(makeRequest({ dopingTypes: ["featured"] }), { params });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.message).toMatch(/TC Kimlik/i);
  });

  it("returns 400 when phone is missing", async () => {
    mockGetUserProfile.mockResolvedValue({
      fullName: "Ahmet Yılmaz",
      taxId: "12345678901",
      phone: null,
      businessAddress: "Atatürk Cad. No:1 34000",
      city: "İstanbul",
      createdAt: new Date().toISOString(),
    });

    const res = await POST(makeRequest({ dopingTypes: ["featured"] }), { params });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.message).toMatch(/telefon|adres|şehir|posta/i);
  });

  it("returns 400 when address is missing", async () => {
    mockGetUserProfile.mockResolvedValue({
      fullName: "Ahmet Yılmaz",
      taxId: "12345678901",
      phone: "+905001234567",
      businessAddress: null,
      city: "İstanbul",
      createdAt: new Date().toISOString(),
    });

    const res = await POST(makeRequest({ dopingTypes: ["featured"] }), { params });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.message).toMatch(/telefon|adres|şehir|posta/i);
  });

  it("returns 400 when city is missing", async () => {
    mockGetUserProfile.mockResolvedValue({
      fullName: "Ahmet Yılmaz",
      taxId: "12345678901",
      phone: "+905001234567",
      businessAddress: "Atatürk Cad. No:1 34000",
      city: null,
      createdAt: new Date().toISOString(),
    });

    const res = await POST(makeRequest({ dopingTypes: ["featured"] }), { params });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.message).toMatch(/telefon|adres|şehir|posta/i);
  });

  it("returns 400 when address has no 5-digit zip code", async () => {
    mockGetUserProfile.mockResolvedValue({
      fullName: "Ahmet Yılmaz",
      taxId: "12345678901",
      phone: "+905001234567",
      businessAddress: "Atatürk Cad. No:1",
      city: "İstanbul",
      createdAt: new Date().toISOString(),
    });

    const res = await POST(makeRequest({ dopingTypes: ["featured"] }), { params });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.message).toMatch(/telefon|adres|şehir|posta/i);
  });

  it("proceeds to doping service when all required fields are present", async () => {
    mockGetUserProfile.mockResolvedValue({
      fullName: "Ahmet Yılmaz",
      taxId: "12345678901",
      phone: "+905001234567",
      businessAddress: "Atatürk Cad. No:1 34000",
      city: "İstanbul",
      createdAt: new Date().toISOString(),
    });

    mockApplyDopingToListing.mockResolvedValue({
      success: true,
      message: "Dopingler başarıyla uygulandı!",
    });

    const res = await POST(makeRequest({ dopingTypes: ["featured"] }), { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockApplyDopingToListing).toHaveBeenCalledOnce();
  });
});
