import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  unstable_cache: vi.fn((fn) => fn),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

const eq = vi.fn();
const order = vi.fn();
const select = vi.fn();
const from = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from,
  })),
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: {
    admin: {
      error: vi.fn(),
    },
    perf: {
      debug: vi.fn(),
    },
  },
}));

describe("getPricingPlans", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eq.mockResolvedValue({ data: [], error: null });
    order.mockReturnValue({ eq });
    select.mockReturnValue({ order });
    from.mockReturnValue({ select });
  });

  it("filters public plans to active ones by default", async () => {
    const { getPricingPlans } = await import("../plans");

    await getPricingPlans();

    expect(eq).toHaveBeenCalledWith("is_active", true);
  });
});
