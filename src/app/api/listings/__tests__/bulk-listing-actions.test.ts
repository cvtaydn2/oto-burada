/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as bulkArchivePOST } from "../bulk-archive/route";
import { withAuthAndCsrf } from "@/lib/utils/api-security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

vi.mock("@/lib/utils/api-security", () => ({
  withAuthAndCsrf: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/monitoring/posthog-server", () => ({
  captureServerEvent: vi.fn(),
}));

describe("Bulk Listing Actions (Archive)", () => {
  const mockUser = { id: "user-123", email: "test@example.com" };
  
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return 401 if unauthorized", async () => {
    vi.mocked(withAuthAndCsrf).mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    } as any);

    const req = new Request("http://localhost/api/listings/bulk-archive", {
      method: "POST",
      body: JSON.stringify({ ids: ["uuid-1"] })
    });

    const res = await bulkArchivePOST(req);
    expect(res.status).toBe(401);
  });

  it("should return 400 if too many IDs provided", async () => {
    vi.mocked(withAuthAndCsrf).mockResolvedValue({
      ok: true,
      user: mockUser
    } as any);

    const ids = Array.from({ length: 21 }, () => crypto.randomUUID());
    const req = new Request("http://localhost/api/listings/bulk-archive", {
      method: "POST",
      body: JSON.stringify({ ids })
    });

    const res = await bulkArchivePOST(req);
    const data = await res.json();
    
    expect(res.status).toBe(400);
    expect(data.error.message).toContain("En fazla 20 ilan");
  });

  it("should return 400 if IDs are not valid UUIDs", async () => {
    vi.mocked(withAuthAndCsrf).mockResolvedValue({
      ok: true,
      user: mockUser
    } as any);

    const req = new Request("http://localhost/api/listings/bulk-archive", {
      method: "POST",
      body: JSON.stringify({ ids: ["invalid-uuid"] })
    });

    const res = await bulkArchivePOST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error.message).toContain("format");
  });

  it("should only affect owned IDs based on DB query filtering", async () => {
    const ownedId = crypto.randomUUID();
    const otherId = crypto.randomUUID();
    
    vi.mocked(withAuthAndCsrf).mockResolvedValue({
      ok: true,
      user: mockUser
    } as unknown as Awaited<ReturnType<typeof withAuthAndCsrf>>);

    const mockUpdate = vi.fn().mockReturnValue({
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [{ id: ownedId }], error: null })
    });

    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ update: mockUpdate })
    } as unknown as any);

    const req = new Request("http://localhost/api/listings/bulk-archive", {
      method: "POST",
      body: JSON.stringify({ ids: [ownedId, otherId] })
    });

    const res = await bulkArchivePOST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.count).toBe(1); // Only 1 was affected
    
    // Verify query parameters
    const updateCall = mockUpdate();
    expect(updateCall.in).toHaveBeenCalledWith("id", [ownedId, otherId]);
    expect(updateCall.eq).toHaveBeenCalledWith("seller_id", mockUser.id);
  });
});
