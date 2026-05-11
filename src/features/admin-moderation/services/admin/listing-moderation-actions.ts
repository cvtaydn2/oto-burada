"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/features/auth/lib/session";
import { getDatabaseListings } from "@/features/marketplace/services/listing-submission-query";
import { getRequiredAppUrl, hasSupabaseAdminEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { Listing } from "@/types";
import type { Json } from "@/types/supabase";

import {
  buildModerationCopy,
  type ModerateListingInput,
  type ModerateListingsInput,
} from "./listing-moderation-pure-logic";
import {
  cascadeDeleteListing,
  executeAtomicModerationRpc,
  fetchAdminListingWithProfile,
  fetchSellerContactIdentity,
  removeStorageBinaries,
} from "./listing-moderation-records";

/**
 * Orchestrates single listing moderation, executing side-effects asynchronously.
 */
export async function moderateListingWithSideEffects({
  action,
  adminUserId,
  listingId,
  rejectReason,
}: ModerateListingInput): Promise<Listing | null> {
  await requireAdminUser();
  const status = action === "approve" ? "approved" : "rejected";
  const appUrl = getRequiredAppUrl();

  // 1. Data Acquisition
  const listing = await fetchAdminListingWithProfile(listingId);
  if (!listing) {
    logger.admin.error("Moderation failed: listing not found", { listingId });
    return null;
  }

  const sellerInfo = await fetchSellerContactIdentity(listing.seller_id);
  if (!sellerInfo?.email) {
    logger.admin.warn(
      "Moderation: seller email not found, in-app notification will be sent but email skipped",
      { listingId, sellerId: listing.seller_id }
    );
  }

  const moderationCopy = buildModerationCopy(listing as unknown as Listing, action, rejectReason);

  // 2. Payload Orchestration
  const outboxPayload = {
    template: action === "approve" ? "listing_approved" : "listing_rejected",
    params:
      action === "approve"
        ? {
            toEmail: sellerInfo?.email,
            toName: sellerInfo?.fullName ?? "Satıcı",
            listingTitle: listing.title,
            listingUrl: `${appUrl}/listing/${listing.slug}`,
          }
        : {
            toEmail: sellerInfo?.email,
            toName: sellerInfo?.fullName ?? "Satıcı",
            listingTitle: listing.title,
            reason: moderationCopy.sellerEmailReason,
            reasonCode: moderationCopy.reasonCode,
          },
  };

  const notificationPayload = {
    title: action === "approve" ? "İlanınız Yayında" : "İlan Reddedildi",
    message: moderationCopy.sellerMessage,
    href:
      action === "approve" ? `/listing/${listing.slug}` : `/dashboard/listings?edit=${listing.id}`,
    reasonCode: moderationCopy.reasonCode,
  };

  // 3. Persistent Execution
  try {
    const result = await executeAtomicModerationRpc({
      listingId,
      status,
      adminUserId,
      note: moderationCopy.moderatorNote ?? moderationCopy.explanation,
      reasonCode: moderationCopy.reasonCode,
      outboxPayload: outboxPayload as Json,
      notificationPayload: notificationPayload as Json,
    });

    if (!result?.success) {
      throw new Error("Atomic result flag unsuccessful.");
    }
  } catch (error) {
    const err = error as Error;
    logger.admin.error("Atomic moderation RPC failed", err, { listingId });
    throw new Error(err.message || "Moderasyon işlemi sırasında kritik veritabanı hatası oluştu.");
  }

  // 4. Async Side-Effect Triggering
  if (action === "approve") {
    const { waitUntil } = await import("@vercel/functions");
    waitUntil(
      (async () => {
        try {
          const { invalidateCache } = await import("@/lib/redis/client");
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
    revalidatePath(`/galeri/${listing.seller.business_slug}`);
  }

  const updated = await getDatabaseListings({ listingId, includeBanned: true });
  return updated?.[0] ?? null;
}

/**
 * Batches moderation operations in restricted-concurrency blocks.
 */
export async function moderateListingsWithSideEffects({
  action,
  adminUserId,
  listingIds,
  rejectReason,
}: ModerateListingsInput) {
  const uniqueIds = [...new Set(listingIds)];
  const CONCURRENCY = 5;
  const moderatedListings: Listing[] = [];
  const skippedListingIds: string[] = [];

  for (let i = 0; i < uniqueIds.length; i += CONCURRENCY) {
    const batch = uniqueIds.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((listingId) =>
        moderateListingWithSideEffects({ action, adminUserId, listingId, rejectReason })
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

/**
 * Fully purges listing and media physically.
 */
export async function adminDeleteDatabaseListing(listingId: string) {
  await requireAdminUser();
  if (!hasSupabaseAdminEnv()) return null;

  const listingResults = await getDatabaseListings({ listingId, includeBanned: true });
  const listing = listingResults?.[0];

  if (!listing) return null;

  // Step A: Fire persistent storage removal
  if (listing.images && listing.images.length > 0) {
    const storagePaths = listing.images
      .map((img: { storagePath: string }) => img.storagePath)
      .filter((path: string) => !!path && path.length > 0);

    if (storagePaths.length > 0) {
      const bucketName = process.env.SUPABASE_STORAGE_BUCKET_LISTINGS ?? "listing-images";
      const success = await removeStorageBinaries(bucketName, storagePaths);

      if (!success) {
        logger.admin.error("Failed to delete listing images from storage - queueing for retry", {
          listingId,
          storagePaths,
        });
        const { queueFileCleanup } = await import("@/lib/registry");
        await queueFileCleanup(bucketName, storagePaths).catch((queueErr) => {
          logger.admin.error("Failed to queue storage cleanup", queueErr, { listingId });
        });
      }
    }
  }

  // Step B: Execute cascading DB teardown
  const dbPurged = await cascadeDeleteListing(listingId);
  if (!dbPurged) return null;

  return { id: listingId, deleted: true };
}
