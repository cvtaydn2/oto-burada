import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

export interface ListingLimits {
  monthly: number;
  yearly: number;
}

export const DEFAULT_LISTING_LIMITS: ListingLimits = {
  monthly: 2,
  yearly: 10,
};

export async function getUserListingCounts(userId: string): Promise<{
  monthly: number;
  yearly: number;
  total: number;
}> {
  if (!hasSupabaseAdminEnv()) {
    return { monthly: 0, yearly: 0, total: 0 };
  }

  const admin = createSupabaseAdminClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

  const { data, error } = await admin
    .from("listings")
    .select("created_at")
    .eq("seller_id", userId)
    .neq("status", "archived");

  if (error || !data) {
    return { monthly: 0, yearly: 0, total: 0 };
  }

  const counts = data.reduce(
    (acc, listing) => {
      acc.total += 1;
      const createdAt = new Date(listing.created_at).toISOString();

      if (createdAt >= startOfYear) {
        acc.yearly += 1;
      }

      if (createdAt >= startOfMonth) {
        acc.monthly += 1;
      }

      return acc;
    },
    { monthly: 0, yearly: 0, total: 0 }
  );

  return counts;
}

/**
 * Atomically checks whether the user is within their listing quota.
 *
 * Uses a Postgres advisory lock (via RPC) so that two concurrent requests
 * for the same user cannot both pass the "check then insert" race condition.
 *
 * Falls back to the non-atomic count check when the RPC is unavailable
 * (e.g. local dev without the migration applied).
 */
export async function checkListingLimit(
  userId: string,
  limits: ListingLimits = DEFAULT_LISTING_LIMITS
): Promise<{
  allowed: boolean;
  reason?: string;
  remaining: { monthly: number; yearly: number };
}> {
  if (!hasSupabaseAdminEnv()) {
    return {
      allowed: true,
      remaining: { monthly: limits.monthly, yearly: limits.yearly },
    };
  }

  const admin = createSupabaseAdminClient();

  // Try the atomic RPC first (requires migration 0042_listing_quota_atomic_check.sql)
  const { data: rpcResult, error: rpcError } = await admin.rpc("check_listing_quota_atomic", {
    p_user_id: userId,
    p_monthly_limit: limits.monthly,
    p_yearly_limit: limits.yearly,
  });

  if (!rpcError && rpcResult !== null) {
    // RPC returns: { allowed: boolean, reason: string | null, monthly_count: int, yearly_count: int }
    const result = rpcResult as {
      allowed: boolean;
      reason: string | null;
      monthly_count: number;
      yearly_count: number;
    };
    return {
      allowed: result.allowed,
      reason: result.reason ?? undefined,
      remaining: {
        monthly: Math.max(0, limits.monthly - result.monthly_count),
        yearly: Math.max(0, limits.yearly - result.yearly_count),
      },
    };
  }

  // Fallback: non-atomic count check (safe for low-traffic / dev environments)
  const counts = await getUserListingCounts(userId);

  const remainingMonthly = Math.max(0, limits.monthly - counts.monthly);
  const remainingYearly = Math.max(0, limits.yearly - counts.yearly);

  if (counts.monthly >= limits.monthly) {
    return {
      allowed: false,
      reason: `Bu ay zaten ${limits.monthly} ilan verdin. Gelecek ay tekrar deneyebilirsin.`,
      remaining: { monthly: remainingMonthly, yearly: remainingYearly },
    };
  }

  if (counts.yearly >= limits.yearly) {
    return {
      allowed: false,
      reason: `Bu yıl zaten ${limits.yearly} ilan verdin. Gelecek yıl tekrar deneyebilirsin.`,
      remaining: { monthly: remainingMonthly, yearly: remainingYearly },
    };
  }

  return {
    allowed: true,
    remaining: { monthly: remainingMonthly, yearly: remainingYearly },
  };
}
