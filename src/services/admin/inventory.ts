"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createAdminModerationAction } from "./moderation-actions";
import { moderateListingWithSideEffects } from "./listing-moderation";
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
    (listing: Record<string, unknown> & {
      images?: { public_url: string; sort_order: number; is_cover: boolean; storage_path: string; placeholder_blur: string | null }[];
    }) => ({
      // camelCase mapping — DB returns snake_case, Listing type expects camelCase
      id: listing.id,
      slug: listing.slug,
      sellerId: listing.seller_id,
      title: listing.title,
      brand: listing.brand,
      model: listing.model,
      carTrim: listing.car_trim ?? null,
      year: listing.year,
      mileage: listing.mileage,
      fuelType: listing.fuel_type,
      transmission: listing.transmission,
      price: listing.price,
      city: listing.city,
      district: listing.district,
      description: listing.description,
      whatsappPhone: listing.whatsapp_phone,
      vin: listing.vin ?? null,
      tramerAmount: listing.tramer_amount ?? null,
      damageStatusJson: listing.damage_status_json ?? null,
      fraudScore: listing.fraud_score ?? 0,
      fraudReason: listing.fraud_reason ?? null,
      status: listing.status,
      featured: listing.featured,
      featuredUntil: listing.featured_until ?? null,
      urgentUntil: listing.urgent_until ?? null,
      highlightedUntil: listing.highlighted_until ?? null,
      eidsVerificationJson: listing.eids_verification_json ?? null,
      marketPriceIndex: listing.market_price_index ?? null,
      expertInspection: listing.expert_inspection ?? undefined,
      bumpedAt: listing.bumped_at ?? null,
      viewCount: listing.view_count ?? 0,
      createdAt: listing.created_at as string,
      updatedAt: listing.updated_at as string,
      images: (listing.images || []).map((img) => ({
        id: img.public_url,  // admin list view only — id not needed for display
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

  // approve / reject — delegate to the full moderation pipeline so that
  // email notifications, seller DB notifications, cache invalidation and
  // market stats all fire correctly.
  if (action === "approve" || action === "reject") {
    if (!adminUserId) {
      // If no adminUserId provided (legacy call), fall through to direct update
      // but log a warning — callers should always pass adminUserId.
      logger.admin.warn("forceActionOnListing called without adminUserId for moderation", { listingId, action });
    }

    const result = await moderateListingWithSideEffects({
      action,
      adminUserId: adminUserId ?? "system",
      listingId,
    });

    if (!result) {
      throw new Error(`Moderasyon başarısız: ilan bulunamadı veya terminal durumda (${listingId})`);
    }

    return { success: true };
  }

  if (action === "delete") {
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

  // action === "archive"
  const { data: listing } = await admin
    .from("listings")
    .select("id, title, seller_id, slug")
    .eq("id", listingId)
    .maybeSingle();

  const { error } = await admin
    .from("listings")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", listingId);

  if (error) {
    logger.admin.error("forceActionOnListing archive failed", error, { listingId });
    throw error;
  }

  if (adminUserId && listing) {
    await createAdminModerationAction({
      action: "archive",
      adminUserId,
      note: `İlan arşivlendi: ${listing.title}`,
      targetId: listingId,
      targetType: "listing",
    }).catch(() => null);

    if (listing.seller_id) {
      await createDatabaseNotification({
        href: `/dashboard/listings`,
        message: `"${listing.title}" ilanın yayından kaldırıldı.`,
        title: "İlanın yayından kaldırıldı",
        type: "moderation",
        userId: listing.seller_id,
      }).catch(() => null);
    }

    captureServerEvent("listing_archived_by_admin", {
      adminUserId,
      listingId,
      sellerId: listing.seller_id,
    });
  }

  return { success: true };
}
