/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createHmac } from "crypto";

vi.mock("@/lib/supabase/admin", () => {
  const mockInsert = vi.fn().mockResolvedValue({ error: null });
  const mockRpc = vi.fn();
  const mockFrom = vi.fn().mockReturnValue({
    insert: mockInsert,
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  });

  return {
    createSupabaseAdminClient: vi.fn(() => ({
      from: mockFrom,
      rpc: mockRpc,
    })),
  };
});

vi.mock("@/lib/supabase/env", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
}));

describe("Payment Webhook Hardening", () => {
  const secretKey = "test-secret";
  process.env.IYZICO_SECRET_KEY = secretKey;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (payload: any, signature?: string) => {
    const searchParams = new URLSearchParams(payload);
    return new Request("http://localhost/api/payments/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-iyz-signature": signature || "",
      },
      body: searchParams.toString(),
    });
  };

  const generateSignature = (token: string) => {
    return createHmac("sha256", secretKey).update(token).digest("hex");
  };

  it("should block invalid signatures and log the attempt", async () => {
    const payload = { token: "token-123", status: "SUCCESS" };
    const req = createRequest(payload, "wrong-signature");
    
    const response = await POST(req);
    expect(response.status).toBe(401);

    const admin = createSupabaseAdminClient() as any;
    expect(admin.from).toHaveBeenCalledWith("payment_webhook_logs");
    expect(admin.from().insert).toHaveBeenCalledWith(expect.objectContaining({
      token: "token-123",
      status: "invalid_signature"
    }));
  });

  it("should handle idempotent requests correctly", async () => {
    const token = "token-123";
    const payload = { token, status: "SUCCESS" };
    const sig = generateSignature(token);
    const req = createRequest(payload, sig);

    const admin = createSupabaseAdminClient() as any;
    admin.rpc.mockResolvedValueOnce({ data: { idempotent: true }, error: null });

    const response = await POST(req);
    const data = await response.json();
    
    expect(data.idempotent).toBe(true);
    expect(admin.from().insert).toHaveBeenCalledWith(expect.objectContaining({
      status: "processed"
    }));
  });

  it("should handle orphan records when token is unknown to system", async () => {
    const token = "unknown-token";
    const payload = { token, status: "SUCCESS" };
    const sig = generateSignature(token);
    const req = createRequest(payload, sig);

    const admin = createSupabaseAdminClient() as any;
    admin.rpc.mockResolvedValueOnce({ data: { orphan: true }, error: null });

    const response = await POST(req);
    const data = await response.json();
    
    expect(data.orphan).toBe(true);
  });
});
