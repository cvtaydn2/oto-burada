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

vi.mock("@/features/shared/lib/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from,
  })),
}));

vi.mock("@/features/shared/lib/logger", () => ({
  logger: {
    admin: {
      error: vi.fn(),
    },
    perf: {
      debug: vi.fn(),
    },
  },
}));

describe("getPublicPricingPlans", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eq.mockResolvedValue({ data: [], error: null });
    order.mockReturnValue({ eq });
    select.mockReturnValue({ order });
    from.mockReturnValue({ select });
  });

  it("filters public plans to active ones", async () => {
    const { getPublicPricingPlans } = await import("../plans");

    await getPublicPricingPlans();

    expect(eq).toHaveBeenCalledWith("is_active", true);
  });
});
