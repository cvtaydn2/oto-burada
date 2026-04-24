import { logger } from "@/lib/utils/logger";
import { sanitizeDescription, sanitizeText } from "@/lib/utils/sanitize";
import { listingCreateSchema } from "@/lib/validators";
import type { Listing, ListingCreateInput } from "@/types";

export interface ListingCreationResult {
  success: boolean;
  listing?: Listing;
  error?: string;
  errorCode?: string;
}

export interface ListingCreationDependencies {
  checkQuota: (userId: string) => Promise<{ allowed: boolean; reason?: string }>;
  getExistingListings: (
    userId: string
  ) => Promise<
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
  runAsyncModeration: (listingId: string) => void;
}

/**
 * Orchestrates the creation of a new car listing.
 *
 * SRP: This function only knows the "process" of creation.
 * DIP: It depends on abstractions (deps), not concrete implementations.
 */
export async function executeListingCreation(
  input: Partial<ListingCreateInput>,
  userId: string,
  deps: ListingCreationDependencies
): Promise<ListingCreationResult> {
  // 1. Quota Check
  const quota = await deps.checkQuota(userId);
  if (!quota.allowed) {
    return {
      success: false,
      error: quota.reason || "İlan sınırına ulaştınız.",
      errorCode: "QUOTA_EXCEEDED",
    };
  }

  // 2. Normalization & Sanitization
  const normalizedInput = {
    ...input,
    title: sanitizeText(input.title || ""),
    description: sanitizeDescription(input.description || ""),
    images: (input.images || []).map(
      (
        img: {
          storagePath: string;
          url: string;
          placeholderBlur?: string | null;
          type?: "photo" | "360" | "video";
        },
        idx: number
      ) => ({
        ...img,
        order: idx,
        isCover: idx === 0,
      })
    ),
  };

  // 3. Validation
  const validation = listingCreateSchema.safeParse(normalizedInput);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Geçersiz ilan verisi.",
      errorCode: "VALIDATION_ERROR",
    };
  }

  // 4. Trust Guards
  const trust = await deps.runTrustGuards(validation.data);
  if (!trust.allowed) {
    return {
      success: false,
      error: trust.message || "Güvenlik kuralları ihlali.",
      errorCode: "TRUST_GUARD_REJECTION",
    };
  }

  // 5. Build Domain Object
  const { buildPendingListing } = await import("@/services/listings/listing-submissions");
  const existingListings = await deps.getExistingListings(userId);
  const listingRecord = buildPendingListing(validation.data, userId, existingListings);

  // 6. Persistence
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

  // 7. Side Effects (non-blocking)
  deps.notifyUser(listing).catch((e) => logger.system.error("Creation notification failed", e));
  deps.trackEvent(listing);
  deps.runAsyncModeration(listing.id);

  return { success: true, listing };
}
