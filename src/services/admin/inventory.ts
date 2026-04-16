"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createAdminModerationAction } from "./moderation-actions";
import { createDatabaseNotification } from "@/services/notifications/notification-records";
import { Listing } from "@/types/domain";
import { logger } from "@/lib/utils/logger";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";

export async function getAdminInventory(filters?: {
  status?: string;
  query?: string;
  page?: number;
  limit?: number;
}) {
  const admin = createSupabaseAdminClient();
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 15;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = admin
    .from("listings")
    .select(
      "*, images:listing_images(id, listing_id, storage_path, public_url, sort_order, is_cover, placeholder_blur)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    if (filters.status === "history") {
      query = query.in("status", ["archived", "rejected"]);
    } else {
      query = query.eq("status", filters.status);
    }
  }

  if (filters?.query) {
    query = query.or(
      `title.ilike.%${filters.query}%,brand.ilike.%${filters.query}%,model.ilike.%${filters.query}%,vin.ilike.%${filters.query}%`,
    );
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    logger.admin.error("getAdminInventory query failed", error, { filters });
    captureServerError("getAdminInventory query failed", "admin", error, { filters });
    return { listings: [] as Listing[], total: 0, page, limit };
  }

  const listings = (data || []).map(
    (listing: { images: { public_url: string; sort_order: number; is_cover: boolean; storage_path: string; placeholder_blur: string | null }[] }) => ({
      ...listing,
      images: (listing.images || []).map((img) => ({
        ...img,
        url: img.public_url || "",
        order: img.sort_order || 0,
        isCover: img.is_cover || false,
        storagePath: img.storage_path || "",
        placeholderBlur: img.placeholder_blur || null,
      })),
    }),
  );

  return { listings: listings as unknown as Listing[], total: count ?? 0, page, limit };
}

export async function forceActionOnListing(
  listingId: string,
  action: "archive" | "delete" | "approve" | "reject",
  adminUserId?: string,
) {
  const admin = createSupabaseAdminClient();

  if (action === "delete") {
    // Fetch listing info before delete for audit
    const { data: listing } = await admin
      .from("listings")
      .select("id, title, seller_id")
      .eq("id", listingId)
      .maybeSingle();

    const { error } = await admin.from("listings").delete().eq("id", listingId);
    if (error) {
      logger.admin.error("forceActionOnListing delete failed", error, { listingId });
      throw error;
    }

    if (adminUserId && listing) {
      await createAdminModerationAction({
        action: "reject",
        adminUserId,
        note: `İlan kalıcı olarak silindi: ${listing.title}`,
        targetId: listingId,
        targetType: "listing",
      }).catch(() => null);
    }

    return { success: true };
  }

  const statusMap: Record<string, string> = {
    archive: "archived",
    approve: "approved",
    reject: "rejected",
  };

  const newStatus = statusMap[action];

  // Fetch listing for notification
  const { data: listing } = await admin
    .from("listings")
    .select("id, title, seller_id, slug")
    .eq("id", listingId)
    .maybeSingle();

  const { error } = await admin
    .from("listings")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", listingId);

  if (error) {
    logger.admin.error("forceActionOnListing update failed", error, { listingId, action });
    throw error;
  }

  // Audit log
  if (adminUserId && listing) {
    await createAdminModerationAction({
      action: action === "approve" ? "approve" : "reject",
      adminUserId,
      note: `Admin zorla ${action}: ${listing.title}`,
      targetId: listingId,
      targetType: "listing",
    }).catch(() => null);

    // Notify seller
    if (listing.seller_id) {
      await createDatabaseNotification({
        href: listing.slug ? `/listing/${listing.slug}` : `/dashboard/listings`,
        message:
          action === "approve"
            ? `"${listing.title}" ilanın yayınlandı.`
            : action === "archive"
              ? `"${listing.title}" ilanın yayından kaldırıldı.`
              : `"${listing.title}" ilanın reddedildi.`,
        title:
          action === "approve"
            ? "İlanın yayınlandı"
            : action === "archive"
              ? "İlanın yayından kaldırıldı"
              : "İlanın reddedildi",
        type: "moderation",
        userId: listing.seller_id,
      }).catch(() => null);
    }

    captureServerEvent("listing_moderated", {
      action,
      adminUserId,
      listingId,
      listingStatus: newStatus,
      sellerId: listing.seller_id,
    });
  }

  return { success: true };
}
