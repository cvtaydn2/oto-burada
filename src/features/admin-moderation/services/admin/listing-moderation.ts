import { getDatabaseListings } from "@/features/marketplace/services/listing-submission-query";
import { listingSchema } from "@/lib";
import { createSupabaseAdminClient } from "@/lib/admin";
import { getRequiredAppUrl } from "@/lib/env";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { Listing } from "@/types";

export type ListingModerationDecision = "approve" | "reject";

interface ModerateListingInput {
  action: ListingModerationDecision;
  adminUserId: string;
  listingId: string;
  note?: string | null;
}

type AtomicModerateListingResult = {
  success: boolean;
};

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

type AtomicModerationRpc = (args: {
  p_admin_id: string;
  p_listing_id: string;
  p_note: string;
  p_notification_payload: Record<string, unknown>;
  p_outbox_payload: Record<string, unknown>;
  p_status: string;
}) => Promise<{ data: AtomicModerateListingResult | null; error: { message?: string } | null }>;

export async function moderateListingWithSideEffects({
  action,
  adminUserId,
  listingId,
  note,
}: ModerateListingInput) {
  const admin = createSupabaseAdminClient();
  const status = action === "approve" ? "approved" : "rejected";
  const appUrl = getRequiredAppUrl();

  // 1. Fetch listing details to build payloads
  const { data: listing, error: fetchError } = await admin
    .from("listings")
    .select("*, seller:profiles!seller_id(*)")
    .eq("id", listingId)
    .single();

  if (fetchError || !listing) {
    logger.admin.error("Moderation failed: listing not found", { listingId });
    return null;
  }

  // 2. Fetch seller email for outbox payload
  const { data: authUser } = await admin.auth.admin.getUserById(listing.seller_id);
  const sellerEmail = authUser?.user?.email;
  const sellerName =
    (authUser?.user?.user_metadata as { full_name?: string } | undefined)?.full_name ?? "Satıcı";

  // Log warning if email not found - in-app notification will still work but email will be skipped
  if (!sellerEmail) {
    logger.admin.warn(
      "Moderation: seller email not found, in-app notification will be sent but email skipped",
      {
        listingId,
        sellerId: listing.seller_id,
      }
    );
  }

  // 3. Prepare payloads
  const outboxPayload = {
    template: action === "approve" ? "listing_approved" : "listing_rejected",
    params:
      action === "approve"
        ? {
            toEmail: sellerEmail,
            toName: sellerName,
            listingTitle: listing.title,
            listingUrl: `${appUrl}/listing/${listing.slug}`,
          }
        : {
            toEmail: sellerEmail,
            toName: sellerName,
            listingTitle: listing.title,
            reason: note ?? undefined,
          },
  };

  const notificationPayload = {
    title: action === "approve" ? "İlanınız Yayında" : "İlan Reddedildi",
    message:
      action === "approve"
        ? `Tebrikler! "${listing.title}" ilanınız onaylandı ve yayına alındı.`
        : `"${listing.title}" ilanınız moderasyon ekibimiz tarafından reddedildi. Notları inceleyip düzenleyebilirsiniz.`,
    href:
      action === "approve" ? `/listing/${listing.slug}` : `/dashboard/listings?edit=${listing.id}`,
  };

  // 4. Execute atomic transaction via RPC
  const atomicModerateListing = admin.rpc.bind(
    admin,
    "atomic_moderate_listing" as never
  ) as unknown as AtomicModerationRpc;
  const { data: moderationResult, error } = await atomicModerateListing({
    p_listing_id: listingId,
    p_status: status,
    p_admin_id: adminUserId,
    p_note: note || buildDefaultModerationNote(listing as unknown as Listing, action),
    p_outbox_payload: outboxPayload,
    p_notification_payload: notificationPayload,
  });

  if (error || !moderationResult?.success) {
    logger.admin.error("Atomic moderation RPC failed", error, { listingId });
    throw new Error(
      error?.message || "Moderasyon işlemi sırasında kritik veritabanı hatası oluştu."
    );
  }

  // 5. Non-atomic secondary side-effects (Cache/Market Stats)
  if (action === "approve") {
    const { waitUntil } = await import("@vercel/functions");
    waitUntil(
      (async () => {
        try {
          const { invalidateCache } = await import("@/lib/client");
          await invalidateCache("listings:approved");
        } catch (err) {
          logger.admin.error(
            "CRITICAL: Cache invalidation failed! System state inconsistent",
            err,
            { listingId }
          );
        }

        try {
          const { updateMarketStats } =
            await import("@/features/marketplace/services/market-stats");
          await updateMarketStats(listing.brand, listing.model, listing.year);
        } catch (err) {
          logger.market.warn("Market stats update failed after approval", { listingId }, err);
        }
      })()
    );
  }

  if (listing.seller?.business_slug) {
    const { revalidatePath } = await import("next/cache");
    revalidatePath(`/galeri/${listing.seller.business_slug}`);
  }

  return (await getDatabaseListings({ listingId, includeBanned: true }))?.[0] ?? null;
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
      const { error: storageError } = await admin.storage.from(bucketName).remove(storagePaths);

      if (storageError) {
        logger.admin.error(
          "Failed to delete listing images from storage - queueing for retry",
          storageError,
          { listingId, storagePaths }
        );

        // Queue orphaned files for cleanup by background job
        const { queueFileCleanup } = await import("@/lib/registry");
        await queueFileCleanup(bucketName, storagePaths).catch((queueErr) => {
          logger.admin.error("Failed to queue storage cleanup", queueErr, { listingId });
        });
      }
    }
  }

  // Continue with DB cleanup even if storage failed - queue handles it
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
