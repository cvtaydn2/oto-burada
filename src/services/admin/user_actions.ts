"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/utils/logger";

export async function toggleUserBan(userId: string, currentStatus: boolean) {
  if (!userId) throw new Error("Kullanıcı ID'si gerekli.");

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("profiles")
    .update({ is_banned: !currentStatus })
    .eq("id", userId);

  if (error) {
    logger.admin.error("toggleUserBan failed", error, { userId, currentStatus });
    throw new Error(`Yasak durumu güncellenemedi: ${error.message}`);
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function promoteUserToAdmin(userId: string) {
  if (!userId) throw new Error("Kullanıcı ID'si gerekli.");

  const supabase = createSupabaseAdminClient();

  // profiles tablosunu güncelle
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userId);

  if (profileError) {
    logger.admin.error("promoteUserToAdmin profiles update failed", profileError, { userId });
    throw new Error(`Yetki güncellenemedi: ${profileError.message}`);
  }

  // Supabase Auth app_metadata güncelle — admin middleware bunu okur
  const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { role: "admin" },
  });

  if (authError) {
    logger.admin.error("promoteUserToAdmin auth metadata update failed", authError, { userId });
    // profiles güncellendi ama auth metadata güncellenemedi — yine de devam et
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(userId: string) {
  if (!userId) throw new Error("Kullanıcı ID'si gerekli.");

  const supabase = createSupabaseAdminClient();

  // Supabase Auth'dan sil — cascade ile profiles da silinir
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    logger.admin.error("deleteUser failed", error, { userId });
    throw new Error(`Kullanıcı silinemedi: ${error.message}`);
  }

  revalidatePath("/admin/users");
  return { success: true };
}
