"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: Record<string, boolean | number | string | null>;
  is_active: boolean;
}

export async function getPricingPlans(includeInactive = false) {
  const admin = createSupabaseAdminClient();
  let query = admin.from("pricing_plans").select("*").order("price", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    logger.admin.error("getPricingPlans query failed", error);
    return [];
  }

  return data as PricingPlan[];
}

export async function updatePricingPlan(id: string, updates: Partial<PricingPlan>) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("pricing_plans").update(updates).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/plans");
  revalidatePath("/dashboard/pricing");
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

  revalidatePath("/admin/plans");
  revalidatePath("/dashboard/pricing");
  return { success: true };
}

export async function createPricingPlan(plan: Omit<PricingPlan, "id">) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("pricing_plans").insert(plan);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/plans");
  revalidatePath("/dashboard/pricing");
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
