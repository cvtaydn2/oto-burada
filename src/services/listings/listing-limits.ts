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

  const monthly = data.filter((l) => new Date(l.created_at) >= new Date(startOfMonth)).length;
  const yearly = data.filter((l) => new Date(l.created_at) >= new Date(startOfYear)).length;

  return { monthly, yearly, total: data.length };
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
