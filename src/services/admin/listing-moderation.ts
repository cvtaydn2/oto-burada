import { getRequiredAppUrl } from "@/lib/environment/env";
import { logger } from "@/lib/logging/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { listingSchema } from "@/lib/validators";
import { getDatabaseListings } from "@/services/listings/listing-submission-query";
import { createDatabaseNotification } from "@/services/notifications/notification-records";
import type { Listing } from "@/types";

import { createAdminModerationAction } from "./moderation-actions";

export type ListingModerationDecision = "approve" | "reject";

interface ModerateListingInput {
  action: ListingModerationDecision;
  adminUserId: string;
  listingId: string;
  note?: string | null;
}

interface ModerateListingsInput {
  action: ListingModerationDecision;
  adminUserId: string;
  listingIds: string[];
  note?: string | null;
}

function buildDefaultModerationNote(listing: Listing, action: ListingModerationDecision) {
  return action === "approve"
    ? `${listing.title} ilanı onaylandı.`
    : `${listing.title} ilanı reddedildi.`;
}

async function sendModerationEmail(
  listing: Listing,
  action: ListingModerationDecision,
  note?: string | null
) {
  try {
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    const admin = createSupabaseAdminClient();
    const { data: authUser } = await admin.auth.admin.getUserById(listing.sellerId);
    const sellerEmail = authUser?.user?.email;
    const sellerName =
      (authUser?.user?.user_metadata as { full_name?: string } | undefined)?.full_name ?? "Satıcı";

    if (!sellerEmail) return;

    const appUrl = getRequiredAppUrl();

    if (action === "approve") {
      const { sendListingApprovedEmail } = await import("@/services/email/email-service");
      await sendListingApprovedEmail({
        toEmail: sellerEmail,
        toName: sellerName,
        listingTitle: listing.title,
        listingUrl: `${appUrl}/listing/${listing.slug}`,
      });
    } else {
      const { sendListingRejectedEmail } = await import("@/services/email/email-service");
      await sendListingRejectedEmail({
        toEmail: sellerEmail,
        toName: sellerName,
        listingTitle: listing.title,
        reason: note ?? undefined,
      });
    }
  } catch (err) {
    // Non-critical — don't fail moderation if email fails
    logger.admin.warn("Moderation email failed to send", { listingId: listing.id, action }, err);
  }
}

async function createModerationSideEffects(
  listing: Listing,
  action: ListingModerationDecision,
  adminUserId: string,
  note?: string | null
) {
  // 1. Audit Action (Immediate)
  await createAdminModerationAction({
    action: action === "approve" ? "approve" : "reject",
    adminUserId,
    note: note || buildDefaultModerationNote(listing, action),
    targetId: listing.id,
    targetType: "listing",
  });

  // 2. Notification (Immediate)
  await createDatabaseNotification({
    href:
      action === "approve" ? `/listing/${listing.slug}` : `/dashboard/listings?edit=${listing.id}`,
    message:
      action === "approve"
        ? `Tebrikler! "${listing.title}" ilanınız onaylandı ve yayına alındı.`
        : `"${listing.title}" ilanınız moderasyon ekibimiz tarafından reddedildi. Notları inceleyip düzenleyebilirsiniz.`,
    title: action === "approve" ? "İlanınız Yayında" : "İlan Reddedildi",
    type: "moderation",
    userId: listing.sellerId,
  });

  // 3. Side effects (Previously fire-and-forget, now awaited for absolute safety in serverless)
  try {
    // Email
    await sendModerationEmail(listing, action, note);

    // If approved, recalculate market stats and invalidate cache
    if (action === "approve") {
      const { invalidateCache } = await import("@/lib/redis/client");
      await invalidateCache("listings:approved").catch((err) =>
        logger.admin.warn(
          "Cache invalidation failed after approval",
          { listingId: listing.id },
          err
        )
      );

      const { updateMarketStats } = await import("@/services/market/market-stats");
      await updateMarketStats(listing.brand, listing.model, listing.year).catch((err) =>
        logger.market.warn(
          "Market stats update failed after approval",
          { listingId: listing.id },
          err
        )
      );
    }

    // Always revalidate seller gallery if it exists
    if (listing.seller?.businessSlug) {
      const { revalidatePath } = await import("next/cache");
      revalidatePath(`/galeri/${listing.seller.businessSlug}`);
      logger.admin.info("Gallery cache revalidated after moderation", {
        slug: listing.seller.businessSlug,
        action,
      });
    }
  } catch (err) {
    logger.admin.error("Moderation side-effects failed", err, { listingId: listing.id });
  }
}

export async function moderateListingWithSideEffects({
  action,
  adminUserId,
  listingId,
  note,
}: ModerateListingInput) {
  const persistedListing = await moderateDatabaseListing(
    listingId,
    action === "approve" ? "approved" : "rejected"
  );

  if (!persistedListing) {
    return null;
  }

  await createModerationSideEffects(persistedListing, action, adminUserId, note);
  return persistedListing;
}

export async function moderateListingsWithSideEffects({
  action,
  adminUserId,
  listingIds,
  note,
}: ModerateListingsInput) {
  const uniqueIds = [...new Set(listingIds)];

  // Process in parallel with a concurrency cap of 5 to avoid overwhelming
  // the DB / email service while still being faster than serial processing.
  const CONCURRENCY = 5;
  const moderatedListings: Listing[] = [];
  const skippedListingIds: string[] = [];

  for (let i = 0; i < uniqueIds.length; i += CONCURRENCY) {
    const batch = uniqueIds.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((listingId) =>
        moderateListingWithSideEffects({ action, adminUserId, listingId, note })
      )
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const listingId = batch[j] as string;
      if (result.status === "fulfilled" && result.value) {
        moderatedListings.push(result.value);
      } else {
        skippedListingIds.push(listingId);
      }
    }
  }

  return { moderatedListings, skippedListingIds };
}

export async function moderateDatabaseListing(
  listingId: string,
  status: Extract<Listing["status"], "approved" | "rejected">
) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const updatePayload: Record<string, string | null> = {
    status,
    updated_at: now,
  };

  if (status === "approved") {
    updatePayload.published_at = now;
  }

  const { data, error } = await admin
    .from("listings")
    .update(updatePayload)
    .eq("id", listingId)
    .in("status", ["pending", "rejected", "approved"])
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    logger.admin.error("moderateDatabaseListing update failed", error, {
      listingId,
      status,
    });
    return null;
  }

  if (!data) {
    return null;
  }

  return (await getDatabaseListings({ listingId, includeBanned: true }))?.[0] ?? null;
}

export async function adminDeleteDatabaseListing(listingId: string) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const listing = (await getDatabaseListings({ listingId, includeBanned: true }))?.[0];

  if (!listing) {
    return null;
  }

  if (listing.images.length > 0) {
    const storagePaths = listing.images
      .map((img: { storagePath: string }) => img.storagePath)
      .filter((path: string) => path.length > 0);

    if (storagePaths.length > 0) {
      const bucketName = process.env.SUPABASE_STORAGE_BUCKET_LISTINGS ?? "listing-images";
      await admin.storage.from(bucketName).remove(storagePaths);
    }
  }

  await admin.from("listing_images").delete().eq("listing_id", listingId);
  await admin.from("favorites").delete().eq("listing_id", listingId);
  await admin.from("reports").delete().eq("listing_id", listingId);

  const { error } = await admin.from("listings").delete().eq("id", listingId);

  if (error) {
    return null;
  }

  return { id: listingId, deleted: true };
}

export function moderateStoredListing(
  existingListing: Listing,
  status: Extract<Listing["status"], "approved" | "rejected">
) {
  return listingSchema.parse({
    ...existingListing,
    status,
    updatedAt: new Date().toISOString(),
  });
}

export function getModeratableListingById(listings: Listing[], listingId: string) {
  return listings.find((listing) => listing.id === listingId && listing.status === "pending");
}
