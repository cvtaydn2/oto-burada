import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/server";
import type { Database } from "@/types/supabase";

interface ExpiringDopingWarningRow {
  id: string;
  user_id: string;
  expires_at: string | null;
  doping_packages: { name: string | null } | { name: string | null }[] | null;
  listings: { title: string | null } | { title: string | null }[] | null;
}

type DopingPurchaseUpdate = Database["public"]["Tables"]["doping_purchases"]["Update"];

function getJoinedFieldValue<T extends Record<string, unknown>, K extends keyof T>(
  value: T | T[] | null,
  key: K,
  fallback: string
) {
  const row = Array.isArray(value) ? value[0] : value;
  const fieldValue = row?.[key];
  return typeof fieldValue === "string" && fieldValue.trim().length > 0 ? fieldValue : fallback;
}

/**
 * Applies a doping package to a listing using the activate_doping RPC.
 * This is typically called after a successful payment.
 *
 * Source of truth: `doping_applications` records + active doping RPC output.
 * We do not trust denormalized listing `_until` fields as canonical state.
 * Those columns are treated as derived cache fields maintained by the database layer.
 *
 * Pure function - no class wrapper
 * Migration: Phase 28.5 - Legacy Service Patterns Migration
 */
export async function applyDopingPackage(params: {
  userId: string;
  listingId: string;
  packageId: string;
  paymentId: string;
}) {
  const supabase = await createSupabaseServerClient();

  // Map slug to DB UUID if needed
  const dbPackageId = await getDbPackageId(params.packageId);
  if (!dbPackageId) {
    throw new Error(`Invalid doping package: ${params.packageId}`);
  }

  // Call the RPC function
  // USE SERVER CLIENT: Enforce RLS and auth context on RPC call
  const { data, error } = await supabase.rpc("activate_doping", {
    p_user_id: params.userId,
    p_listing_id: params.listingId,
    p_package_id: dbPackageId,
    p_payment_id: params.paymentId,
  });

  if (error) {
    logger.payments.error("Doping activation RPC failed", error);
    throw new Error(`Doping activation failed: ${error.message}`);
  }

  if (!data?.success) {
    throw new Error(data?.error || "Doping activation failed");
  }

  const activeDopings = await getActiveDopingsForListing(params.listingId);

  return {
    purchaseId: data.purchaseId,
    expiresAt: data.expiresAt,
    activeDopings,
  };
}

/**
 * Helper to map package slug (id in DOPING_PACKAGES) to DB UUID
 * Private helper function
 */
async function getDbPackageId(slug: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("doping_packages").select("id").eq("slug", slug).single();

  return data?.id || null;
}

/**
 * Get active dopings for a listing.
 *
 * Authoritative source is the database RPC backed by `doping_applications`.
 * This avoids coupling application logic to denormalized cache columns on `listings`.
 *
 * Pure function - no class wrapper
 * Migration: Phase 28.5 - Legacy Service Patterns Migration
 */
export async function getActiveDopingsForListing(listingId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_active_dopings_for_listing", {
    p_listing_id: listingId,
  });

  if (error) {
    logger.payments.error("Failed to get active dopings", error);
    return [];
  }

  return data || [];
}

/**
 * Scans for active dopings that expire in the next 24 hours and generates
 * in-app notifications for the users. Updates their record so they're not spammed again.
 * Consumed by master cron process.
 */
export async function warnExpiringDopings() {
  const { createDatabaseNotificationsBulk } =
    await import("@/features/notifications/services/notification-records");
  const { createSupabaseAdminClient } = await import("@/lib/admin");

  const admin = createSupabaseAdminClient();

  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data: expiringDopings, error } = await admin
      .from("doping_purchases")
      .select(
        `
        id,
        user_id,
        expires_at,
        doping_packages(name),
        listings(title)
      `
      )
      .eq("status", "active")
      .eq("expiry_warning_sent", false)
      .lte("expires_at", next24h)
      .gt("expires_at", now.toISOString())
      .returns<ExpiringDopingWarningRow[]>();

    if (error) {
      logger.payments.error("Failed to fetch expiring dopings for warnings", error);
      return { success: false, count: 0, error: error.message };
    }

    if (!expiringDopings || expiringDopings.length === 0) {
      return { success: true, count: 0 };
    }

    const notifications = expiringDopings.map((item) => {
      const packageName = getJoinedFieldValue(item.doping_packages, "name", "Doping");
      const listingTitle = getJoinedFieldValue(item.listings, "title", "ilanın");

      return {
        userId: item.user_id,
        type: "system" as const,
        title: "Dopingin bitiyor",
        message: `"${listingTitle}" için aktif olan "${packageName}" dopingin 24 saat içinde sona erecek.`,
        href: `/dashboard/listings`,
      };
    });

    await createDatabaseNotificationsBulk(notifications);

    const purchaseIds = expiringDopings.map((item) => item.id);
    const warningSentPatch: DopingPurchaseUpdate = { expiry_warning_sent: true };
    await admin.from("doping_purchases").update(warningSentPatch).in("id", purchaseIds);

    logger.payments.info(`Successfully sent expiry warnings for ${purchaseIds.length} dopings`);
    return { success: true, count: purchaseIds.length };
  } catch (err) {
    logger.payments.error("Warn expiring dopings logic threw exception", err);
    return { success: false, count: 0, error: "Internal exception" };
  }
}
