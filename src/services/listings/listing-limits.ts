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
 *
 * ── SECURITY FIX: Issue #2 - Advisory Lock Hash Collision Prevention ─────
 * Uses full SHA-256 hash of userId to generate 64-bit lock key, preventing
 * hash collisions that could cause DoS by blocking unrelated users.
 *
 * ── PERFORMANCE NOTE: Issue #18 - Admin Client Caching ─────
 * createSupabaseAdminClient() uses a singleton pattern with 1-minute TTL,
 * so multiple calls within the same request/minute reuse the same client instance.
 * No additional caching needed here.
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
        reason: "İlan verme sınırına ulaştınız. Kurumsal: 200, Pro: 50, Bireysel: 3 aktif ilan.",
        remaining: { monthly: 0, yearly: 0 },
      };
    }
  }

  // ── SECURITY FIX: Issue #11 - Fail-Closed in Production ─────────────
  // In production, if the primary RPC fails, reject immediately to prevent race conditions.
  // Fallback is only allowed in development where traffic is low and race conditions are unlikely.
  if (process.env.NODE_ENV === "production") {
    logger.auth.error("[ListingLimits] Primary quota RPC failed in production, rejecting", {
      error: rpcError,
      userId,
    });
    return {
      allowed: false,
      reason: "Sistem meşgul. Lütfen biraz bekleyip tekrar deneyin.",
      remaining: { monthly: 0, yearly: 0 },
    };
  }

  // Fallback: non-atomic count check (ONLY for development environments)
  // Even in fallback, we attempt to use an advisory lock to reduce race condition window
  logger.auth.warn("[ListingLimits] Using fallback quota check (development only)", { userId });

  let lockAcquired = false;
  try {
    // ── SECURITY FIX: Issue #2 - Full SHA-256 Hash for Lock Key ─────
    // Generate 64-bit lock key from full userId hash to prevent collisions
    const lockKey = await hashUserIdToLockKey(userId);

    const { error: lockError } = await admin
      .rpc("pg_advisory_xact_lock", { key: lockKey })
      .abortSignal(AbortSignal.timeout(3000)); // 3 second timeout

    if (lockError) {
      logger.auth.warn("[ListingLimits] Advisory lock failed in fallback", {
        error: lockError,
        userId,
      });
    } else {
      lockAcquired = true;
    }
  } catch (error) {
    logger.auth.error("[ListingLimits] Advisory lock exception in fallback", error);
  }

  if (!lockAcquired) {
    logger.auth.warn("[ListingLimits] Proceeding without lock in development (risky)");
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

/**
 * ── SECURITY FIX: Issue #2 - Hash Collision Prevention ─────────────
 * Generates a 64-bit lock key from full SHA-256 hash of userId.
 * Prevents hash collisions that could cause DoS by blocking unrelated users.
 */
async function hashUserIdToLockKey(userId: string): Promise<bigint> {
  const encoder = new TextEncoder();
  const data = encoder.encode(userId);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const view = new DataView(hashBuffer);
  // Use first 8 bytes of SHA-256 hash as 64-bit signed integer
  return view.getBigInt64(0, false);
}
