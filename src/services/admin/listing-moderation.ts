import { createDatabaseNotification } from "@/services/notifications/notification-records";
import { moderateDatabaseListing } from "@/services/listings/listing-submissions";
import type { Listing } from "@/types";
import { logger } from "@/lib/utils/logger";
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
  note?: string | null,
) {
  try {
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    const admin = createSupabaseAdminClient();
    const { data: authUser } = await admin.auth.admin.getUserById(listing.sellerId);
    const sellerEmail = authUser?.user?.email;
    const sellerName =
      (authUser?.user?.user_metadata as { full_name?: string } | undefined)?.full_name ??
      "Satıcı";

    if (!sellerEmail) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://otoburada.com";

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
  note?: string | null,
) {
  await createAdminModerationAction({
    action: action === "approve" ? "approve" : "reject",
    adminUserId,
    note: note || buildDefaultModerationNote(listing, action),
    targetId: listing.id,
    targetType: "listing",
  });

  await createDatabaseNotification({
    href: `/dashboard/listings?edit=${listing.id}`,
    message:
      action === "approve"
        ? `"${listing.title}" ilanin yayinlandi. Artik public listede gorunuyor.`
        : `"${listing.title}" ilanin moderasyon tarafindan reddedildi. Notlari inceleyip guncelleyebilirsin.`,
    title: action === "approve" ? "Ilanin onaylandi" : "Ilanin reddedildi",
    type: "moderation",
    userId: listing.sellerId,
  });

  // Fire-and-forget email — doesn't block moderation response
  sendModerationEmail(listing, action, note);

  // If approved, recalculate market stats and invalidate cache
  if (action === "approve") {
    const { invalidateCache } = await import("@/lib/redis/client");
    invalidateCache("listings:approved").catch((err) =>
      logger.admin.warn("Cache invalidation failed after approval", { listingId: listing.id }, err)
    );

    const { updateMarketStats } = await import("@/services/market/market-stats");
    updateMarketStats(listing.brand, listing.model, listing.year).catch((err) =>
      logger.market.warn("Market stats update failed after approval", { listingId: listing.id }, err)
    );
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
    action === "approve" ? "approved" : "rejected",
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
  const moderatedListings: Listing[] = [];
  const skippedListingIds: string[] = [];

  for (const listingId of uniqueIds) {
    const moderatedListing = await moderateListingWithSideEffects({
      action,
      adminUserId,
      listingId,
      note,
    });

    if (!moderatedListing) {
      skippedListingIds.push(listingId);
      continue;
    }

    moderatedListings.push(moderatedListing);
  }

  return {
    moderatedListings,
    skippedListingIds,
  };
}
