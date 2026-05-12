/**
 * Bug 5: Image delete unregisters registry before storage delete
 *
 * Verifies the correct order: verify ownership → remove from storage → unregister.
 * Also verifies that registry metadata is preserved when storage removal fails.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockVerifyFileOwnership = vi.fn();
const mockUnregisterFileById = vi.fn();

vi.mock("@/lib/registry", () => ({
  countDailyUserUploads: vi.fn(() => 0),
  registerFileInRegistry: vi.fn(),
  verifyFileOwnership: (...args: unknown[]) => mockVerifyFileOwnership(...args),
  unregisterFileById: (...args: unknown[]) => mockUnregisterFileById(...args),
}));

vi.mock("@/lib/security", () => ({
  withAuthAndCsrf: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseStorageEnv: vi.fn(() => true),
  getSupabaseStorageEnv: vi.fn(() => ({ listingsBucket: "listing-images" })),
}));

const mockRemove = vi.fn();
vi.mock("@/lib/server", () => ({
  createSupabaseServerClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({ remove: mockRemove })),
    },
  })),
}));

vi.mock("@/lib/telemetry-server", () => ({
  captureServerError: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { storage: { warn: vi.fn(), error: vi.fn() } },
}));

vi.mock("@/features/marketplace/services/listing-images", () => ({
  validateListingImageFile: vi.fn(() => null),
  getVerifiedMimeType: vi.fn(() => "image/jpeg"),
  buildListingImageStoragePath: vi.fn(() => "listings/user-1/uuid.jpg"),
}));

vi.mock("@/lib/upload-policy", () => ({
  UPLOAD_POLICY: { IMAGES: { MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, MAX_DAILY_UPLOADS: 50 } },
}));

import { withAuthAndCsrf } from "@/lib/security";

const mockUser = { id: "user-1" };

function makeDeleteRequest(storagePath: string) {
  return new Request("http://localhost/api/listings/images", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storagePath }),
  });
}

describe("DELETE /api/listings/images — correct operation order", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(withAuthAndCsrf).mockResolvedValue({ ok: true, user: mockUser } as any);
  });

  it("returns 403 without touching storage when ownership check fails", async () => {
    mockVerifyFileOwnership.mockResolvedValue(null); // not owner

    const { DELETE } = await import("../images/route");
    const res = await DELETE(makeDeleteRequest("listings/other-user/photo.jpg"));

    expect(res.status).toBe(403);
    expect(mockRemove).not.toHaveBeenCalled();
    expect(mockUnregisterFileById).not.toHaveBeenCalled();
  });

  it("does NOT unregister when storage removal fails (preserves metadata)", async () => {
    mockVerifyFileOwnership.mockResolvedValue("registry-id-123");
    mockRemove.mockResolvedValue({ error: { message: "storage error" } });

    const { DELETE } = await import("../images/route");
    const res = await DELETE(makeDeleteRequest("listings/user-1/photo.jpg"));

    expect(res.status).toBe(500);
    // Registry must NOT be unregistered — metadata preserved for retry/audit
    expect(mockUnregisterFileById).not.toHaveBeenCalled();
  });

  it("unregisters AFTER successful storage removal", async () => {
    mockVerifyFileOwnership.mockResolvedValue("registry-id-123");
    mockRemove.mockResolvedValue({ error: null, data: [{}] });
    mockUnregisterFileById.mockResolvedValue(true);

    const { DELETE } = await import("../images/route");
    const res = await DELETE(makeDeleteRequest("listings/user-1/photo.jpg"));

    expect(res.status).toBe(200);
    expect(mockRemove).toHaveBeenCalled();
    expect(mockUnregisterFileById).toHaveBeenCalledWith("registry-id-123");
  });

  it("enforces correct call order: verify → storage → unregister", async () => {
    const callOrder: string[] = [];

    mockVerifyFileOwnership.mockImplementation(async () => {
      callOrder.push("verify");
      return "registry-id-123";
    });
    mockRemove.mockImplementation(async () => {
      callOrder.push("storage");
      return { error: null };
    });
    mockUnregisterFileById.mockImplementation(async () => {
      callOrder.push("unregister");
      return true;
    });

    const { DELETE } = await import("../images/route");
    await DELETE(makeDeleteRequest("listings/user-1/photo.jpg"));

    expect(callOrder).toEqual(["verify", "storage", "unregister"]);
  });
});
