/**
 * Bug 7: bulk-delete counts failures as successes
 *
 * Verifies that only genuine { deleted: true } results are counted as successes,
 * and that truthy error objects (e.g. { error: "CONFLICT" }) are not counted.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/security", () => ({
  withAuthAndCsrf: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimitProfiles: { general: {} },
}));

vi.mock("@/lib/telemetry-server", () => ({
  captureServerEvent: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { listings: { info: vi.fn(), error: vi.fn() } },
}));

const mockDeleteDatabaseListing = vi.fn();
vi.mock("@/features/marketplace/services/listing-submissions", () => ({
  deleteDatabaseListing: (...args: unknown[]) => mockDeleteDatabaseListing(...args),
}));

import { withAuthAndCsrf } from "@/lib/security";

const mockUser = { id: "user-1" };

function makeRequest(ids: string[]) {
  return new Request("http://localhost/api/listings/bulk-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
}

describe("POST /api/listings/bulk-delete — accurate success counting", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(withAuthAndCsrf).mockResolvedValue({ ok: true, user: mockUser } as any);
  });

  it("counts only { deleted: true } results as successes", async () => {
    const id1 = crypto.randomUUID();
    const id2 = crypto.randomUUID();
    const id3 = crypto.randomUUID();

    mockDeleteDatabaseListing
      .mockResolvedValueOnce({ id: id1, deleted: true }) // success
      .mockResolvedValueOnce({ error: "CONFLICT" }) // truthy but NOT a success
      .mockResolvedValueOnce(null); // not found

    const { POST } = await import("../bulk-delete/route");
    const res = await POST(makeRequest([id1, id2, id3]));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.count).toBe(1); // Only the first was a genuine success
  });

  it("returns 404 when all deletions fail", async () => {
    const id1 = crypto.randomUUID();
    const id2 = crypto.randomUUID();

    mockDeleteDatabaseListing
      .mockResolvedValueOnce({ error: "CONFLICT" })
      .mockResolvedValueOnce(null);

    const { POST } = await import("../bulk-delete/route");
    const res = await POST(makeRequest([id1, id2]));

    expect(res.status).toBe(404);
  });

  it("returns 200 with count=0 when ids array is empty", async () => {
    // Empty ids should fail validation (min 1 id required)
    const { POST } = await import("../bulk-delete/route");
    const res = await POST(makeRequest([]));
    // Validation should reject empty array
    expect(res.status).toBe(400);
  });

  it("does not count null (not found/not archived) as success", async () => {
    const id1 = crypto.randomUUID();
    mockDeleteDatabaseListing.mockResolvedValueOnce(null);

    const { POST } = await import("../bulk-delete/route");
    const res = await POST(makeRequest([id1]));

    expect(res.status).toBe(404);
  });
});
