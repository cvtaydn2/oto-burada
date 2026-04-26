import { logger } from "@/lib/logging/logger";
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

  const { data, error } = await admin.rpc("get_user_listing_stats", {
    p_user_id: userId,
    p_start_of_month: startOfMonth,
    p_start_of_year: startOfYear,
  });

  if (error || !data) {
    logger.auth.error("[ListingLimits] Failed to get listing stats via RPC", error);
    return { monthly: 0, yearly: 0, total: 0 };
  }

  const stats = data as { total: number; monthly: number; yearly: number };

  return {
    total: stats.total,
    monthly: stats.monthly,
    yearly: stats.yearly,
  };
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

  // Try the atomic RPC first (requires migration 0104_atomic_quota_and_performance_indexes.sql)
  const { data: allowed, error: rpcError } = await admin.rpc("check_and_reserve_listing_quota", {
    p_user_id: userId,
  });

  if (!rpcError && typeof allowed === "boolean") {
    if (allowed) {
      return {
        allowed: true,
        remaining: { monthly: limits.monthly, yearly: limits.yearly },
      };
    } else {
      return {
        allowed: false,
        reason: "Listing quota exceeded. Professionals: 50, Standard: 3 active listings.",
        remaining: { monthly: 0, yearly: 0 },
      };
    }
  }

  // Fallback: non-atomic count check (safe for low-traffic / dev environments)
  // Even in fallback, we attempt to use an advisory lock to reduce race condition window
  try {
    const lockKey = parseInt(userId.replace(/-/g, "").slice(0, 8), 16);
    await admin.rpc("pg_advisory_xact_lock", { key: lockKey });
  } catch (e) {
    // Ignore if advisory lock RPC is not exposed/available
  }

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
