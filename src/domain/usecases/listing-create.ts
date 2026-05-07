import { buildPendingListing } from "@/features/marketplace/services/listing-submissions";
import { logger } from "@/features/shared/lib/logger";
import type { Listing, ListingCreateInput } from "@/types";

export interface ListingCreationResult {
  success: boolean;
  listing?: Listing;
  error?: string;
  errorCode?: string;
}

export interface ListingCreationDependencies {
  checkQuota: (userId: string) => Promise<{ allowed: boolean; reason?: string }>;
  getExistingListings: (userId: string) => Promise<
    {
      id: string;
      slug: string;
      brand?: string;
      model?: string;
      year?: number;
      mileage?: number;
      price?: number;
      vin?: string | null;
      status?: string;
    }[]
  >;
  runTrustGuards: (
    input: ListingCreateInput
  ) => Promise<{ allowed: boolean; reason?: string; message?: string }>;
  saveListing: (listing: Listing) => Promise<{ listing?: Listing; error?: string }>;
  notifyUser: (listing: Listing) => Promise<void>;
  trackEvent: (listing: Listing) => void;
  runAsyncModeration: (listingId: string, listingSnapshot?: Listing) => void;
}

/**
 * Orchestrates the creation of a new car listing.
 *
 * SRP: This function only knows the "process" of creation.
 * DIP: It depends on abstractions (deps), not concrete implementations.
 *
 * ── ARCHITECTURE FIX: Issue #9 - Type Safety in Use Case ─────────────
 * Input is now fully typed (not Partial) for compile-time safety.
 * Structural validation happens in route handler, not in use case.
 * Use case focuses on business rules only (quota, trust guards).
 */
export async function executeListingCreation(
  input: ListingCreateInput, // ✅ Full type, not Partial
  userId: string,
  deps: ListingCreationDependencies
): Promise<ListingCreationResult> {
  // 1. Quota Check (business rule)
  const quota = await deps.checkQuota(userId);
  if (!quota.allowed) {
    return {
      success: false,
      error: quota.reason || "İlan sınırına ulaştınız.",
      errorCode: "QUOTA_EXCEEDED",
    };
  }

  // 2. Trust Guards (business rule)
  const trust = await deps.runTrustGuards(input);
  if (!trust.allowed) {
    return {
      success: false,
      error: trust.message || "Güvenlik kuralları ihlali.",
      errorCode: "TRUST_GUARD_REJECTION",
    };
  }

  // 3. Build Domain Object
  const existingListings = await deps.getExistingListings(userId);
  const listingRecord = buildPendingListing(input, userId, existingListings);

  // 4. Persistence
  const saveResult = await deps.saveListing(listingRecord);
  if (saveResult.error || !saveResult.listing) {
    return {
      success: false,
      error:
        saveResult.error === "slug_collision"
          ? "Bu başlıkla bir ilan zaten mevcut."
          : "Veritabanı hatası.",
      errorCode: saveResult.error === "slug_collision" ? "SLUG_COLLISION" : "DB_ERROR",
    };
  }

  const listing = saveResult.listing;

  // 5. Side Effects (non-blocking)
  // ── BUG FIX: Issue BUG-05 - Side Effect Error Handling ─────────────
  // All fire-and-forget side effects must have consistent error handling to prevent
  // unhandled promise rejections and ensure observability of failures.
  deps.notifyUser(listing).catch((e) => logger.system.error("Creation notification failed", e));

  try {
    deps.trackEvent(listing);
  } catch (e) {
    logger.system.error("Analytics tracking failed", e);
  }

  // ── BUG FIX: Issue LISTING-01 - Async Moderation Error Handling ──────────
  // Wrap async moderation in Promise.resolve().catch() to prevent unhandled rejections
  Promise.resolve(deps.runAsyncModeration(listing.id, listing)).catch((e) =>
    logger.system.error("Async moderation failed", e)
  );

  return { success: true, listing };
}
