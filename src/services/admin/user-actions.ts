"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth/session";
import { logger } from "@/lib/logging/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { uuidSchema } from "@/lib/validators/admin";
import { logAdminAction } from "@/services/admin/moderation-actions";
import { createDatabaseNotification } from "@/services/notifications/notification-records";

export async function toggleUserBan(userId: string, currentStatus: boolean) {
  const validatedUserId = uuidSchema.parse(userId);
  await requireAdminUser();
  const { executeServerAction } = await import("@/lib/action-utils/action-utils");

  return executeServerAction(
    "toggleUserBan",
    async () => {
      const admin = createSupabaseAdminClient();

      // ── SECURITY FIX: Issue ADMIN-02 - Atomic Ban with Listing Rejection ──
      // Use atomic RPC to ensure profile update and listing rejection happen together
      const { data: result, error: rpcError } = await admin.rpc("ban_user_atomic", {
        p_user_id: validatedUserId,
        p_reason: !currentStatus ? "Admin tarafından yasaklandı" : null,
        p_preserve_metadata: true,
      });

      if (rpcError) throw new Error(rpcError.message);

      // Sync to Auth App Metadata for lightweight middleware checks (F-12)
      await admin.auth.admin.updateUserById(validatedUserId, {
        app_metadata: { is_banned: !currentStatus },
      });

      // Get business slug for revalidation
      const { data: profile } = await admin
        .from("profiles")
        .select("business_slug")
        .eq("id", validatedUserId)
        .single();

      if (profile?.business_slug) {
        revalidatePath(`/galeri/${profile.business_slug}`);
      }

      return {
        newStatus: !currentStatus,
        listingsRejected: result?.listings_rejected || 0,
      };
    },
    {
      revalidatePaths: ["/admin/users", `/admin/users/${userId}`],
      logContext: { userId: validatedUserId, currentStatus },
    }
  );
}

export async function banUser(userId: string, reason: string) {
  const validatedUserId = uuidSchema.parse(userId);
  await requireAdminUser();
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      is_banned: true,
      ban_reason: reason || "Admin tarafından yasaklandı",
    })
    .eq("id", validatedUserId);

  if (error) throw new Error(`Kullanıcı yasaklanamadı: ${error.message}`);

  // Sync to Auth App Metadata (F-12)
  await admin.auth.admin.updateUserById(validatedUserId, {
    app_metadata: { is_banned: true },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

export async function promoteUserToAdmin(userId: string) {
  const validatedUserId = uuidSchema.parse(userId);
  await requireAdminUser();
  const admin = createSupabaseAdminClient();
  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", validatedUserId);

  if (profileError) throw new Error(`Yetki güncellenemedi: ${profileError.message}`);

  await admin.auth.admin.updateUserById(validatedUserId, {
    app_metadata: { role: "admin" },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

export async function updateUserRole(userId: string, role: "user" | "admin" | "professional") {
  const validatedUserId = uuidSchema.parse(userId);
  await requireAdminUser();
  const admin = createSupabaseAdminClient();
  const nextRole = role === "admin" ? "admin" : "user";
  const nextUserType = role === "professional" ? "professional" : "individual";

  const { error } = await admin
    .from("profiles")
    .update({
      role: nextRole,
      user_type: nextUserType,
    })
    .eq("id", validatedUserId);

  if (error) throw new Error(`Rol güncellenemedi: ${error.message}`);

  await admin.auth.admin.updateUserById(validatedUserId, {
    app_metadata: { role: nextRole },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

export async function handleVerificationReview(
  userId: string,
  status: "approved" | "rejected",
  feedback?: string,
  adminUserId?: string
): Promise<{ success: boolean; error?: string }> {
  const validatedUserId = uuidSchema.parse(userId);
  await requireAdminUser();
  const admin = createSupabaseAdminClient();

  // 1. Check restriction status
  const { data: profile, error: fetchError } = await admin
    .from("profiles")
    .select("is_banned, verification_status, business_slug")
    .eq("id", validatedUserId)
    .single();

  if (fetchError || !profile) {
    return { success: false, error: "Kullanıcı bulunamadı." };
  }

  if (status === "approved" && profile.is_banned) {
    return { success: false, error: "Yasaklanmış/Kısıtlanmış kullanıcılar onaylanamaz." };
  }

  // 2. Perform update
  const { error: updateError } = await admin
    .from("profiles")
    .update({
      verification_status: status,
      verification_feedback: feedback || null,
      verification_reviewed_at: new Date().toISOString(),
      verification_reviewed_by: adminUserId || null,
      verified_business: status === "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", validatedUserId);

  if (updateError) {
    logger.admin.error("handleVerificationReview update failed", updateError, {
      userId: validatedUserId,
      status,
    });
    return { success: false, error: updateError.message };
  }

  // 3. Audit Log
  if (adminUserId) {
    await logAdminAction({
      action: status === "approved" ? "approve" : "reject",
      adminUserId,
      note: `İşletme doğrulaması ${status === "approved" ? "onaylandı" : "reddedildi"}.${feedback ? ` Not: ${feedback}` : ""}`,
      targetId: validatedUserId,
      targetType: "user",
    });
  }

  // 4. Notify User
  await createDatabaseNotification({
    userId,
    type: "system",
    title: status === "approved" ? "Hesabınız doğrulandı!" : "Doğrulama talebi reddedildi",
    message:
      status === "approved"
        ? "Tebrikler! İşletme hesabınız onaylandı. Artık galeriniz herkese görünür."
        : `Doğrulama talebiniz maalesef reddedildi. ${feedback ? `Sebep: ${feedback}` : "Lütfen bilgilerinizi kontrol edip tekrar deneyin."}`,
    href: "/dashboard/profile",
  }).catch((err) => logger.admin.warn("Verification notification failed", { userId, status }, err));

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/galeriler"); // Revalidate gallery list
  if (profile.business_slug) {
    revalidatePath(`/galeri/${profile.business_slug}`);
  }

  return { success: true };
}

/**
 * Legacy wrapper updated to use the new state machine.
 */
export async function verifyUserBusiness(userId: string) {
  const validatedUserId = uuidSchema.parse(userId);
  return handleVerificationReview(validatedUserId, "approved");
}

export async function deleteUser(userId: string) {
  const validatedUserId = uuidSchema.parse(userId);
  await requireAdminUser();
  const admin = createSupabaseAdminClient();

  try {
    // 1. Overwrite profile with anonymized data (Hard Anonymization)
    // This allows keeping the record for Referencing Integrity (e.g. past payments/listings)
    // while scrubing all Personal Identifiable Information (PII).
    // Node runtime always has crypto.randomUUID() — no fallback needed.
    const randomSuffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
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
        updated_at: new Date().toISOString(),
      })
      .eq("id", validatedUserId);

    if (profileError) {
      logger.admin.error("Profile anonymization failed", profileError, { userId: validatedUserId });
      throw new Error(`Kullanıcı verileri anonimleştirilemedi: ${profileError.message}`);
    }

    // 2. Delete from Auth (This invalidates all tokens and removes from auth.users)
    const { error: authError } = await admin.auth.admin.deleteUser(validatedUserId);

    if (authError) {
      // Note: If deleting from auth fails because of FK constraints in other tables,
      // the profile remains anonymized (which is already a win for KVKK).
      logger.admin.error("Auth user deletion failed", authError, { userId: validatedUserId });
      throw new Error(`Kullanıcı oturumu sonlandırılamadı: ${authError.message}`);
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Beklenmedik bir hata oluştu.";
    return { success: false, error: msg };
  }
}

export async function grantUserCredits(userId: string, credits: number, note: string) {
  const validatedUserId = uuidSchema.parse(userId);
  const adminUser = await requireAdminUser();

  const admin = createSupabaseAdminClient();

  const { error: rpcError } = await admin.rpc("adjust_user_credits_atomic", {
    p_user_id: validatedUserId,
    p_amount: credits,
    p_type: "admin_grant",
    p_description: note || "Admin tarafından manuel kredi yüklemesi",
    p_reference_id: `Admin:${validatedUserId}`,
  });

  if (rpcError) {
    logger.admin.error("Failed to grant credits", rpcError, { userId: validatedUserId, credits });
    return { success: false, error: rpcError.message };
  }

  await logAdminAction({
    action: "credit_grant",
    adminUserId: adminUser.id,
    targetId: validatedUserId,
    targetType: "user",
    note: `${credits} kredi yüklendi${note ? `: ${note}` : ""}`,
  });

  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

export async function grantUserDoping(
  userId: string,
  listingId: string,
  dopingTypes: string[],
  durationDays: number = 7
) {
  const validatedUserId = uuidSchema.parse(userId);
  const validatedListingId = uuidSchema.parse(listingId);
  const adminUser = await requireAdminUser();

  const admin = createSupabaseAdminClient();

  for (const dopingType of dopingTypes) {
    const { error: insertError } = await admin.from("listing_dopings").insert({
      listing_id: validatedListingId,
      doping_type: dopingType,
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
    });

    if (insertError) {
      logger.admin.error("Failed to grant doping", insertError, {
        userId: validatedUserId,
        listingId: validatedListingId,
        dopingType,
      });
      return { success: false, error: insertError.message };
    }
  }

  await logAdminAction({
    action: "doping_grant",
    adminUserId: adminUser.id,
    targetId: validatedListingId,
    targetType: "listing",
    note: `${dopingTypes.join(", ")} doping ${durationDays} gün boyunca eklendi (Kullanıcı: ${validatedUserId})`,
  });

  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}
