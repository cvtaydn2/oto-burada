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

  // Three parallel COUNT queries — no row data transferred, DB does the counting
  const [totalResult, monthlyResult, yearlyResult] = await Promise.all([
    admin
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", userId)
      .neq("status", "archived"),
    admin
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", userId)
      .neq("status", "archived")
      .gte("created_at", startOfMonth),
    admin
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", userId)
      .neq("status", "archived")
      .gte("created_at", startOfYear),
  ]);

  return {
    total: totalResult.count ?? 0,
    monthly: monthlyResult.count ?? 0,
    yearly: yearlyResult.count ?? 0,
  };
}

export async function checkListingLimit(userId: string, limits: ListingLimits = DEFAULT_LISTING_LIMITS): Promise<{
  allowed: boolean;
  reason?: string;
  remaining: {
    monthly: number;
    yearly: number;
  };
}> {
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
