"use server";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/admin";
import { logger } from "@/lib/logger";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  listing_quota: number;
  features: string[];
  is_active: boolean;
  type: "individual" | "professional" | "corporate";
}

function mapPricingPlan(row: PricingPlan): PricingPlan {
  let features: string[] = [];
  if (Array.isArray(row.features)) {
    features = row.features as string[];
  } else if (row.features && typeof row.features === "object") {
    const obj = row.features as Record<string, boolean | number | string | null>;
    features = Object.keys(obj).filter((k) => obj[k]);
  }

  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    credits: Number(row.credits),
    listing_quota: Number((row as { listing_quota?: number }).listing_quota) || 3,
    features,
    is_active: Boolean(row.is_active),
    type: determinePlanType(row.name),
  };
}

function determinePlanType(name: string): "individual" | "professional" | "corporate" {
  const lower = name.toLowerCase();
  if (lower.includes("kurumsal") || lower.includes("corporate") || lower.includes("filo")) {
    return "corporate";
  }
  if (lower.includes("pro") || lower.includes("profesyonel") || lower.includes("professional")) {
    return "professional";
  }
  return "individual";
}

// ─── Cache Keys & Tags ────────────────────────────────────────────────────────
const PRICING_TAGS = {
  ALL: "pricing-plans",
  PUBLIC: "pricing-plans-public",
  ADMIN: "pricing-plans-admin",
} as const;

// ─── Query Logic (Isolated) ────────────────────────────────────────────────────
async function fetchPricingPlansFromDb(includeInactive: boolean): Promise<PricingPlan[]> {
  const start = Date.now();
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("pricing_plans")
    .select("id, name, price, credits, features, listing_quota, is_active")
    .order("price", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    logger.admin.error("getPricingPlans query failed", error);
    return [];
  }

  const result = (data as unknown as PricingPlan[]).map(mapPricingPlan);
  logger.perf.debug("fetchPricingPlansFromDb execution", {
    duration: Date.now() - start,
    includeInactive,
  });
  return result;
}

// ─── Public API ───────────────────────────────────────────────────────────────
export const getPublicPricingPlans = unstable_cache(
  () => fetchPricingPlansFromDb(false),
  [PRICING_TAGS.PUBLIC],
  {
    revalidate: 3600,
    tags: [PRICING_TAGS.ALL, PRICING_TAGS.PUBLIC],
  }
);

export const getAdminPricingPlans = unstable_cache(
  () => fetchPricingPlansFromDb(true),
  [PRICING_TAGS.ADMIN],
  {
    revalidate: 3600,
    tags: [PRICING_TAGS.ALL, PRICING_TAGS.ADMIN],
  }
);

// ─── Mutations ────────────────────────────────────────────────────────────────
async function revalidatePricingCaches() {
  // @ts-expect-error: Next.js 16 revalidateTag signature mismatch
  await revalidateTag(PRICING_TAGS.ALL);
  await revalidatePath("/admin/plans", "page");
  await revalidatePath("/dashboard/pricing", "page");
}

export type PricingPlanInput = {
  name: string;
  price: number;
  credits: number;
  listing_quota: number;
  is_active: boolean;
  features: string[] | Record<string, boolean | number | string | null>;
};

export async function updatePricingPlan(id: string, updates: Partial<PricingPlanInput>) {
  const admin = createSupabaseAdminClient();
  const dbUpdates = updates as unknown as TablesUpdate<"pricing_plans">;
  const { error } = await admin.from("pricing_plans").update(dbUpdates).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await revalidatePricingCaches();
  return { success: true };
}

export async function togglePlanStatus(id: string, currentStatus: boolean) {
  return updatePricingPlan(id, { is_active: !currentStatus });
}

export async function deletePricingPlan(id: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("pricing_plans").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await revalidatePricingCaches();
  return { success: true };
}

export async function createPricingPlan(plan: Omit<PricingPlanInput, never>) {
  const admin = createSupabaseAdminClient();
  const dbPlan = plan as unknown as TablesInsert<"pricing_plans">;
  const { error } = await admin.from("pricing_plans").insert(dbPlan);

  if (error) {
    throw new Error(error.message);
  }

  await revalidatePricingCaches();
  return { success: true };
}

// ─── Plan Satın Alma Geçmişi ─────────────────────────────────────────────────

export interface PlanPurchaseRecord {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  planId: string | null;
  planName: string | null;
  amount: number;
  status: string;
  provider: string;
  createdAt: string;
}

export async function getPlanPurchases(planId?: string): Promise<PlanPurchaseRecord[]> {
  const admin = createSupabaseAdminClient();

  let query = admin
    .from("payments")
    .select(
      "id, user_id, plan_id, plan_name, amount, status, provider, created_at, profiles(full_name)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (planId) {
    query = query.eq("plan_id", planId);
  } else {
    // plan_id'si olan ödemeleri getir (paket satışları)
    // plan_id yoksa doping ödemesi — onları da göster ama ayırt et
    query = query.not("plan_id", "is", null);
  }

  const { data, error } = await query;

  if (error) {
    logger.admin.error("getPlanPurchases query failed", error, { planId });
    // plan_id kolonu henüz yoksa boş dön
    if (error.code === "42703") return [];
    return [];
  }

  // Auth'dan email çekmek pahalı — profiles tablosunda email yoksa null bırak
  return (data ?? []).map((row) => {
    const profile = row.profiles as { full_name?: string } | null;
    return {
      id: row.id as string,
      userId: row.user_id as string,
      userName: profile?.full_name ?? null,
      userEmail: null, // Auth'dan ayrıca çekilmez — performans için
      planId: row.plan_id as string | null,
      planName: row.plan_name as string | null,
      amount: Number(row.amount),
      status: row.status as string,
      provider: row.provider as string,
      createdAt: row.created_at as string,
    };
  });
}

export async function getPlanStats(): Promise<{
  totalRevenue: number;
  totalSales: number;
  byPlan: { planName: string; count: number; revenue: number }[];
}> {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("payments")
    .select("plan_name, amount, status")
    .eq("status", "success")
    .not("plan_id", "is", null);

  if (error || !data) {
    return { totalRevenue: 0, totalSales: 0, byPlan: [] };
  }

  const byPlan: Record<string, { count: number; revenue: number }> = {};
  let totalRevenue = 0;

  data.forEach((row) => {
    const name = (row.plan_name as string) ?? "Bilinmeyen";
    const amount = Number(row.amount);
    if (!byPlan[name]) byPlan[name] = { count: 0, revenue: 0 };
    byPlan[name].count++;
    byPlan[name].revenue += amount;
    totalRevenue += amount;
  });

  return {
    totalRevenue,
    totalSales: data.length,
    byPlan: Object.entries(byPlan).map(([planName, v]) => ({ planName, ...v })),
  };
}
