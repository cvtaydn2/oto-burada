"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/utils/logger";
import { adjustUserCredits, logDopingApplication } from "@/services/billing/transaction-service";
import { createDatabaseNotification } from "@/services/notifications/notification-records";

export async function grantCreditsToUser(
  userId: string,
  credits: number,
  note: string,
  adminUserId: string,
): Promise<{ success: boolean; error?: string }> {
  const admin = createSupabaseAdminClient();
  try {
    await adjustUserCredits({
      userId,
      amount: credits,
      type: 'admin_adjustment',
      description: `Hediye kredi (Admin: ${adminUserId}): ${note}`,
      referenceId: adminUserId,
      metadata: { note, grantedBy: adminUserId }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
    logger.admin.error("grantCreditsToUser failed", error, { userId, credits });
    return { success: false, error: errorMessage };
  }

  // Audit log
  await admin.from("admin_actions").insert({
    action: "approve",
    admin_user_id: adminUserId,
    note: `Hediye kredi: ${credits} kredi eklendi. Not: ${note}`,
    target_id: userId,
    target_type: "user",
  });

  // Notification
  await createDatabaseNotification({
    userId,
    type: "system",
    title: "Krediniz güncellendi",
    message: `Hesabınıza ${credits} kredi tanımlandı. Kredilerinizi ilan öne çıkarma ve doping özelliklerinde kullanabilirsiniz.`,
    href: "/dashboard/pricing",
  }).catch((err) => {
    logger.admin.warn("Credit notification failed", { userId, credits }, err);
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

export async function grantDopingToListing(
  listingId: string,
  dopingTypes: string[],
  durationDays: number,
  adminUserId: string,
): Promise<{ success: boolean; error?: string }> {
  const admin = createSupabaseAdminClient();
  const until = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: listing } = await admin.from("listings").select("seller_id").eq("id", listingId).single();
  const userId = listing?.seller_id;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (dopingTypes.includes("featured")) {
    updates.featured = true;
    updates.featured_until = until;
  }
  if (dopingTypes.includes("urgent")) {
    updates.urgent_until = until;
  }
  if (dopingTypes.includes("highlighted")) {
    updates.highlighted_until = until;
  }

  const { error } = await admin.from("listings").update(updates).eq("id", listingId);

  if (error) {
    logger.admin.error("grantDopingToListing failed", error, { listingId });
    return { success: false, error: error.message };
  }

  for (const type of dopingTypes) {
    await logDopingApplication({
      listingId,
      userId,
      dopingType: type,
      durationDays,
      metadata: { adminUserId, reason: 'admin_grant' }
    });
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

export async function toggleUserBan(userId: string, currentStatus: boolean) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ 
       is_banned: !currentStatus,
       ban_reason: !currentStatus ? "Admin tarafından yasaklandı" : null
    })
    .eq("id", userId);

  if (error) throw new Error(`Yasak durumu güncellenemedi: ${error.message}`);
  
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

export async function banUser(userId: string, reason: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ 
       is_banned: true,
       ban_reason: reason || "Admin tarafından yasaklandı"
    })
    .eq("id", userId);

  if (error) throw new Error(`Kullanıcı yasaklanamadı: ${error.message}`);
  
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

export async function promoteUserToAdmin(userId: string) {
  const admin = createSupabaseAdminClient();
  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userId);

  if (profileError) throw new Error(`Yetki güncellenemedi: ${profileError.message}`);

  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: "admin" },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

export async function updateUserRole(userId: string, role: "user" | "admin" | "professional") {
  const admin = createSupabaseAdminClient();
  const nextRole = role === "admin" ? "admin" : "user";
  const nextUserType = role === "professional" ? "professional" : "individual";

  const { error } = await admin
    .from("profiles")
    .update({
      role: nextRole,
      user_type: nextUserType,
    })
    .eq("id", userId);

  if (error) throw new Error(`Rol güncellenemedi: ${error.message}`);

  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: nextRole },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

export async function verifyUserBusiness(userId: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ 
       verified_business: true 
    })
    .eq("id", userId);

  if (error) throw new Error(`İşletme doğrulanamadı: ${error.message}`);
  
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

export async function deleteUser(userId: string) {
  const admin = createSupabaseAdminClient();
  
  try {
    // 1. Overwrite profile with anonymized data (Hard Anonymization)
    // This allows keeping the record for Referencing Integrity (e.g. past payments/listings)
    // while scrubing all Personal Identifiable Information (PII).
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        full_name: `Anonymized User ${randomSuffix}`,
        phone: "00000000000",
        city: "Anonymized",
        avatar_url: null,
        business_name: null,
        business_address: null,
        business_logo_url: null,
        business_description: null,
        tax_id: null,
        tax_office: null,
        website_url: null,
        business_slug: null,
        is_banned: true,
        ban_reason: "Account Deleted / Anonymized",
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (profileError) {
      logger.admin.error("Profile anonymization failed", profileError, { userId });
      throw new Error(`Kullanıcı verileri anonimleştirilemedi: ${profileError.message}`);
    }

    // 2. Delete from Auth (This invalidates all tokens and removes from auth.users)
    const { error: authError } = await admin.auth.admin.deleteUser(userId);
    
    if (authError) {
      // Note: If deleting from auth fails because of FK constraints in other tables, 
      // the profile remains anonymized (which is already a win for KVKK).
      logger.admin.error("Auth user deletion failed", authError, { userId });
      throw new Error(`Kullanıcı oturumu sonlandırılamadı: ${authError.message}`);
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Beklenmedik bir hata oluştu.";
    return { success: false, error: msg };
  }
}
