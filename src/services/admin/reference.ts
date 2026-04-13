"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getBrands() {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("brands")
    .select("*")
    .order("name", { ascending: true });

  if (error) return [];
  return data;
}

export async function getModelsByBrand(brandId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("models")
    .select("*")
    .eq("brand_id", brandId)
    .order("name", { ascending: true });

  if (error) return [];
  return data;
}

export async function toggleBrandStatus(id: string, currentStatus: boolean) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("brands")
    .update({ is_active: !currentStatus })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/reference");
  return { success: true };
}

export async function addBrand(name: string) {
  const admin = createSupabaseAdminClient();
  const slug = name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
  
  const { error } = await admin
    .from("brands")
    .insert({ name, slug, is_active: true });

  if (error) throw error;
  revalidatePath("/admin/reference");
  return { success: true };
}
