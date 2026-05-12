/**
 * Bug 8: bulk-archive bypasses optimistic concurrency/version logic
 *
 * Verifies that bulk-archive uses archiveDatabaseListing (which applies OCC)
 * rather than a raw bulk update, and that conflicts are reported accurately.
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

const mockArchiveDatabaseListing = vi.fn();
vi.mock("@/features/marketplace/services/listing-submissions", () => ({
  archiveDatabaseListing: (...args: unknown[]) => mockArchiveDatabaseListing(...args),
}));

import { withAuthAndCsrf } from "@/lib/security";

const mockUser = { id: "user-1" };

function makeRequest(ids: string[]) {
  return new Request("http://localhost/api/listings/bulk-archive", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
}

describe("POST /api/listings/bulk-archive — OCC via archiveDatabaseListing", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(withAuthAndCsrf).mockResolvedValue({ ok: true, user: mockUser } as any);
  });

  it("calls archiveDatabaseListing for each id (not a raw bulk update)", async () => {
    const id1 = crypto.randomUUID();
    const id2 = crypto.randomUUID();

    mockArchiveDatabaseListing.mockResolvedValue({ data: { id: id1 } });

    const { POST } = await import("../bulk-archive/route");
    await POST(makeRequest([id1, id2]));

    expect(mockArchiveDatabaseListing).toHaveBeenCalledTimes(2);
    expect(mockArchiveDatabaseListing).toHaveBeenCalledWith(id1, mockUser.id);
    expect(mockArchiveDatabaseListing).toHaveBeenCalledWith(id2, mockUser.id);
  });

  it("counts only non-error results as successes", async () => {
    const id1 = crypto.randomUUID();
    const id2 = crypto.randomUUID();
    const id3 = crypto.randomUUID();

    mockArchiveDatabaseListing
      .mockResolvedValueOnce({ data: { id: id1 } }) // success
      .mockResolvedValueOnce({ error: "CONFLICT" }) // concurrent update
      .mockResolvedValueOnce(null); // not found / not owned

    const { POST } = await import("../bulk-archive/route");
    const res = await POST(makeRequest([id1, id2, id3]));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.count).toBe(1);
    expect(data.data.conflictCount).toBe(1);
  });

  it("reports conflictCount=0 when no conflicts occur", async () => {
    const id1 = crypto.randomUUID();
    mockArchiveDatabaseListing.mockResolvedValue({ data: { id: id1 } });

    const { POST } = await import("../bulk-archive/route");
    const res = await POST(makeRequest([id1]));
    const data = await res.json();

    expect(data.data.conflictCount).toBe(0);
  });

  it("returns 200 with count=0 when all listings are not found", async () => {
    const id1 = crypto.randomUUID();
    mockArchiveDatabaseListing.mockResolvedValue(null);

    const { POST } = await import("../bulk-archive/route");
    const res = await POST(makeRequest([id1]));
    const data = await res.json();

    // count=0 is still a valid response (not a 404 like bulk-delete)
    expect(res.status).toBe(200);
    expect(data.data.count).toBe(0);
  });
});
