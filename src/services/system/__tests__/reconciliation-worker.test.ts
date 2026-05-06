import { beforeEach, describe, expect, it, vi } from "vitest";

const mockInfo = vi.fn();
const mockWarn = vi.fn();
const mockError = vi.fn();
const mockDebug = vi.fn();

vi.mock("@/lib/logging/logger", () => ({
  logger: {
    system: {
      info: (...args: unknown[]) => mockInfo(...args),
      warn: (...args: unknown[]) => mockWarn(...args),
      error: (...args: unknown[]) => mockError(...args),
      debug: (...args: unknown[]) => mockDebug(...args),
    },
  },
}));

const mockCreateSupabaseServerClient = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => mockCreateSupabaseServerClient(),
}));

function createSupabaseClientMock(params: {
  users: Array<{ id: string; role: "corporate"; subscription_synced_at: string | null }>;
  paymentByUser: Record<string, { data: unknown; error: { message: string } | null }>;
}) {
  const profileUpdateEq = vi.fn().mockResolvedValue({ error: null });
  const profileUpdate = vi.fn().mockReturnValue({ eq: profileUpdateEq });

  let currentPaymentUserId: string | null = null;

  const paymentsMaybeSingle = vi.fn(async () => {
    if (!currentPaymentUserId) return { data: null, error: null };
    return params.paymentByUser[currentPaymentUserId] ?? { data: null, error: null };
  });

  const paymentsLimit = vi.fn(() => ({ maybeSingle: paymentsMaybeSingle }));
  const paymentsOrder = vi.fn(() => ({ limit: paymentsLimit }));
  const paymentsNot = vi.fn(() => ({ order: paymentsOrder }));
  const paymentsEq = vi.fn((column: string, value: string) => {
    if (column === "user_id") currentPaymentUserId = value;
    return { eq: paymentsEq, not: paymentsNot };
  });
  const paymentsSelect = vi.fn(() => ({ eq: paymentsEq }));

  const profilesOr = vi.fn().mockResolvedValue({ data: params.users, error: null });
  const profilesEq = vi.fn(() => ({ or: profilesOr }));
  const profilesSelect = vi.fn(() => ({ eq: profilesEq }));

  const from = vi.fn((table: string) => {
    if (table === "profiles") {
      return {
        select: profilesSelect,
        update: profileUpdate,
      };
    }

    if (table === "payments") {
      return {
        select: paymentsSelect,
      };
    }

    return {};
  });

  return {
    client: { from },
    spies: {
      profileUpdate,
      profileUpdateEq,
    },
  };
}

describe("processReconciliation - subscription status safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("downgrades expired user", async () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const mock = createSupabaseClientMock({
      users: [{ id: "user-expired", role: "corporate", subscription_synced_at: null }],
      paymentByUser: {
        "user-expired": {
          data: {
            id: "payment-1",
            plan_name: "Kurumsal Filo",
            metadata: { expires_at: past },
            created_at: new Date().toISOString(),
          },
          error: null,
        },
      },
    });

    mockCreateSupabaseServerClient.mockResolvedValue(mock.client);

    const { processReconciliation } = await import("../reconciliation-worker");
    await processReconciliation();

    expect(mock.spies.profileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ role: "user" })
    );
    expect(mock.spies.profileUpdateEq).toHaveBeenCalledWith("id", "user-expired");
  });

  it("keeps valid user active", async () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const mock = createSupabaseClientMock({
      users: [{ id: "user-active", role: "corporate", subscription_synced_at: null }],
      paymentByUser: {
        "user-active": {
          data: {
            id: "payment-2",
            plan_name: "Corporate Fleet",
            metadata: { expires_at: future },
            created_at: new Date().toISOString(),
          },
          error: null,
        },
      },
    });

    mockCreateSupabaseServerClient.mockResolvedValue(mock.client);

    const { processReconciliation } = await import("../reconciliation-worker");
    await processReconciliation();

    expect(mock.spies.profileUpdate).toHaveBeenCalledWith(
      expect.not.objectContaining({ role: "user" })
    );
  });

  it("treats uncertain data as expired (fail-safe)", async () => {
    const mock = createSupabaseClientMock({
      users: [{ id: "user-uncertain", role: "corporate", subscription_synced_at: null }],
      paymentByUser: {
        "user-uncertain": {
          data: {
            id: "payment-3",
            plan_name: "Kurumsal Filo",
            metadata: { no_expiry_here: true },
            created_at: new Date().toISOString(),
          },
          error: null,
        },
      },
    });

    mockCreateSupabaseServerClient.mockResolvedValue(mock.client);

    const { processReconciliation } = await import("../reconciliation-worker");
    await processReconciliation();

    expect(mock.spies.profileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ role: "user" })
    );
    expect(mockWarn).toHaveBeenCalled();
  });
});
