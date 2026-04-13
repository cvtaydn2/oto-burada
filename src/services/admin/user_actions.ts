"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function toggleUserBan(userId: string, currentStatus: boolean) {
  const supabase = createSupabaseAdminClient();
  
  const { error } = await supabase
    .from("profiles")
    .update({ is_banned: !currentStatus })
    .eq("id", userId);

  if (error) throw error;
  
  revalidatePath("/admin/users");
  return { success: true };
}

export async function promoteUserToAdmin(userId: string) {
  const supabase = createSupabaseAdminClient();
  
  const { error } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userId);

  if (error) throw error;
  
  revalidatePath("/admin/users");
  return { success: true };
}
