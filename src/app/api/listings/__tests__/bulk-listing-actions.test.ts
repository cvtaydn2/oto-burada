/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { withAuthAndCsrf } from "@/features/shared/lib/security";

vi.mock("@/features/shared/lib/security", () => ({
  withAuthAndCsrf: vi.fn(),
}));

vi.mock("@/features/shared/lib/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/features/shared/lib/telemetry-server", () => ({
  captureServerEvent: vi.fn(),
}));

const mockArchiveDatabaseListing = vi.fn();
vi.mock("@/features/marketplace/services/listing-submissions", () => ({
  archiveDatabaseListing: (...args: unknown[]) => mockArchiveDatabaseListing(...args),
}));

import { POST as bulkArchivePOST } from "../bulk-archive/route";

describe("Bulk Listing Actions (Archive)", () => {
  const mockUser = { id: "user-123", email: "test@example.com" };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return 401 if unauthorized", async () => {
    vi.mocked(withAuthAndCsrf).mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    } as any);

    const req = new Request("http://localhost/api/listings/bulk-archive", {
      method: "POST",
      body: JSON.stringify({ ids: ["uuid-1"] }),
    });

    const res = await bulkArchivePOST(req);
    expect(res.status).toBe(401);
  });

  it("should return 400 if too many IDs provided", async () => {
    vi.mocked(withAuthAndCsrf).mockResolvedValue({
      ok: true,
      user: mockUser,
    } as any);

    const ids = Array.from({ length: 21 }, () => crypto.randomUUID());
    const req = new Request("http://localhost/api/listings/bulk-archive", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });

    const res = await bulkArchivePOST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error.message).toContain("En fazla 20 ilan");
  });

  it("should return 400 if IDs are not valid UUIDs", async () => {
    vi.mocked(withAuthAndCsrf).mockResolvedValue({
      ok: true,
      user: mockUser,
    } as any);

    const req = new Request("http://localhost/api/listings/bulk-archive", {
      method: "POST",
      body: JSON.stringify({ ids: ["invalid-uuid"] }),
    });

    const res = await bulkArchivePOST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error.message).toContain("format");
  });

  it("should only count successfully archived listings (uses OCC via archiveDatabaseListing)", async () => {
    const ownedId = crypto.randomUUID();
    const otherId = crypto.randomUUID();

    vi.mocked(withAuthAndCsrf).mockResolvedValue({
      ok: true,
      user: mockUser,
    } as unknown as Awaited<ReturnType<typeof withAuthAndCsrf>>);

    // ownedId succeeds, otherId returns null (not found / not owned)
    mockArchiveDatabaseListing
      .mockResolvedValueOnce({ data: { id: ownedId } })
      .mockResolvedValueOnce(null);

    const req = new Request("http://localhost/api/listings/bulk-archive", {
      method: "POST",
      body: JSON.stringify({ ids: [ownedId, otherId] }),
    });

    const res = await bulkArchivePOST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.count).toBe(1); // Only 1 was affected

    // Verify archiveDatabaseListing was called with correct args
    expect(mockArchiveDatabaseListing).toHaveBeenCalledWith(ownedId, mockUser.id);
    expect(mockArchiveDatabaseListing).toHaveBeenCalledWith(otherId, mockUser.id);
  });
});
