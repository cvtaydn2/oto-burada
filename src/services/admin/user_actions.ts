"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function toggleUserBan(userId: string, currentStatus: boolean) {
  if (!userId) throw new Error("Kullanıcı ID'si gerekli.");
  
  const supabase = createSupabaseAdminClient();
  
  const { error } = await supabase
    .from("profiles")
    .update({ is_banned: !currentStatus })
    .eq("id", userId);

  if (error) {
    console.error("Ban toggle error:", error);
    throw new Error(`Yasak durumu güncellenemedi: ${error.message}`);
  }
  
  revalidatePath("/admin/users");
  return { success: true };
}

export async function promoteUserToAdmin(userId: string) {
  if (!userId) throw new Error("Kullanıcı ID'si gerekli.");
  
  const supabase = createSupabaseAdminClient();
  
  const { error } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userId);

  if (error) {
    console.error("Promote error:", error);
    throw new Error(`Yetki güncellenemedi: ${error.message}`);
  }
  
  revalidatePath("/admin/users");
  return { success: true };
}
