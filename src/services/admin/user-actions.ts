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
  } catch (error: any) {
    logger.admin.error("grantCreditsToUser failed", error, { userId, credits });
    return { success: false, error: error.message };
  }

  // Audit log
  await admin.from("admin_actions").insert({
    action: "approve",
    admin_user_id: adminUserId,
    note: `Hediye kredi: ${credits} kredi eklendi. Not: ${note}`,
    target_id: userId,
    target_type: "user",
  });

  // Kullanıcıya in-app bildirim gönder
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
