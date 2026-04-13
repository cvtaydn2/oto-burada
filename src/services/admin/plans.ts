"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: Record<string, boolean | number | string | null>;
  is_active: boolean;
}

export async function getPricingPlans() {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("pricing_plans")
    .select("*")
    .order("price", { ascending: true });

  if (error) {
    console.error("Error fetching plans:", error);
    return [];
  }

  return data as PricingPlan[];
}

export async function updatePricingPlan(id: string, updates: Partial<PricingPlan>) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("pricing_plans")
    .update(updates)
    .eq("id", id);

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
