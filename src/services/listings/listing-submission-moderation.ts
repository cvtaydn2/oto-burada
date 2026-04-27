import { FRAUD_SCORE_WEIGHTS, PRICE_ANOMALY_THRESHOLDS } from "@/config/fraud-thresholds";
import { withNextCache } from "@/lib/caching/cache";
import { logger } from "@/lib/logging/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { estimateVehiclePrice } from "@/services/market/price-estimation";
import { createDatabaseNotification } from "@/services/notifications/notification-records";
import { Listing, ListingCreateInput } from "@/types";

const TRUST_GUARD_REJECTION_WINDOW_MS = 24 * 60 * 60 * 1000;
const TRUST_GUARD_REJECTION_THRESHOLD = 3;
const TRUST_GUARD_METADATA_PREFIX = "[AUTO_TRUST_GUARD]";
const TRACKED_TRUST_GUARD_REASONS = new Set([
  "duplicate_vin",
  "duplicate_plate",
  "extreme_price_outlier",
]);
const ASYNC_MODERATION_CACHE_TTL_SECONDS = 300;

interface TrustGuardRejectionAttempt {
  at: string;
  reason: "duplicate_vin" | "duplicate_plate" | "extreme_price_outlier";
  source: "create" | "edit";
}

interface TrustGuardRejectionMetadata {
  attempts: TrustGuardRejectionAttempt[];
  reviewReason?: string;
  reviewRequestedAt?: string;
}

async function getCachedFraudComparisonListings(params: {
  brand: string;
  listingId: string;
  model: string;
  year: number;
}) {
  const admin = createSupabaseAdminClient();

  return withNextCache(
    [`fraud-comparison:${params.brand}:${params.model}:${params.year}`],
    async () => {
      const { data } = await admin
        .from("listings")
        .select("id, slug, brand, model, year, mileage, price, vin, status")
        .eq("brand", params.brand)
        .eq("model", params.model)
        .eq("year", params.year)
        .limit(100);

      return data ?? [];
    },
    ASYNC_MODERATION_CACHE_TTL_SECONDS
  );
}

export function calculateFraudScore(
  input: ListingCreateInput,
  existingListings: {
    id: string;
    slug: string;
    brand?: string;
    model?: string;
    year?: number;
    mileage?: number;
    price?: number;
    sellerId?: string;
    vin?: string | null;
    status?: string;
  }[],
  sellerStats?: {
    trustScore?: number;
    isVerified?: boolean;
    approvedListingsCount?: number;
  }
): { fraudScore: number; fraudReason: string | null; suggestedStatus?: Listing["status"] } {
  let score = 0;
  const reasons: string[] = [];
  let suggestedStatus: Listing["status"] | undefined = undefined;

  // 1. Basic matching (potential duplicate)
  const isDuplicate = existingListings.some(
    (l) =>
      l.brand === input.brand &&
      l.model === input.model &&
      l.year === input.year &&
      l.mileage === input.mileage &&
      l.price === input.price
  );
  if (isDuplicate) {
    score += 50;
    reasons.push("Mükerrer ilan şüphesi");
  }

  // 2. VIN Clone detection
  const vinDuplicate = input.vin
    ? existingListings.find(
        (l) => l.vin === input.vin && l.status !== "archived" && l.status !== "rejected"
      )
    : undefined;
  if (vinDuplicate) {
    score += 100;
    reasons.push("Aynı şasi numaralı başka bir aktif ilan mevcut (VIN clone)");
  }

  // 3. Price Anomaly detection
  const similarListings = existingListings.filter(
    (l) =>
      l.brand === input.brand &&
      l.model === input.model &&
      l.year === input.year &&
      l.price &&
      l.price > 0
  );

  if (similarListings.length >= 3) {
    const avgPrice =
      similarListings.reduce((sum, current) => sum + (current.price || 0), 0) /
      similarListings.length;

    if (input.price < avgPrice * PRICE_ANOMALY_THRESHOLDS.FRAUD_SCORE_LOW) {
      score += FRAUD_SCORE_WEIGHTS.PRICE_TOO_LOW;
      reasons.push(
        `Fiyat ortalamanın %${Math.round((1 - PRICE_ANOMALY_THRESHOLDS.FRAUD_SCORE_LOW) * 100)} altında (${Math.round(avgPrice)} TL)`
      );
      suggestedStatus = "flagged";
    } else if (input.price > avgPrice * PRICE_ANOMALY_THRESHOLDS.FRAUD_SCORE_HIGH) {
      score += FRAUD_SCORE_WEIGHTS.PRICE_TOO_HIGH;
      reasons.push(
        `Fiyat ortalamanın %${Math.round((PRICE_ANOMALY_THRESHOLDS.FRAUD_SCORE_HIGH - 1) * 100)} üzerinde (${Math.round(avgPrice)} TL)`
      );
      suggestedStatus = "flagged";
    }
  }

  // 4. Mileage Anomaly
  const vehicleAge = new Date().getFullYear() - input.year;
  if (vehicleAge >= 10 && input.mileage < 10000) {
    score += 40;
    reasons.push("Kilometre anomalisini (yaşa göre çok düşük)");
    suggestedStatus = suggestedStatus || "flagged";
  }

  // 5. Tramer/Damage Discrepancy (with normalized damage status)
  if (input.damageStatusJson && (input.tramerAmount === 0 || !input.tramerAmount)) {
    // Normalize damage status values before checking
    const normalizedDamageStatus = Object.fromEntries(
      Object.entries(input.damageStatusJson).map(([k, v]) => [k, v === "orjinal" ? "orijinal" : v])
    );

    const suspiciousStatuses = ["boyali", "lokal_boyali", "degisen"];
    const changedPartsCount = Object.values(normalizedDamageStatus).filter((s) =>
      suspiciousStatuses.includes(s as string)
    ).length;

    if (changedPartsCount >= 3) {
      score += 30;
      reasons.push("Çoklu boya/değişen kaydına rağmen hasar kaydı beyan edilmemiş");
    }
  }

  // 6. Seller Reputation adjustment (Trust multiplier approach)
  // Apply trust as a multiplier rather than subtraction to ensure it always has effect
  let trustMultiplier = 1.0;

  if (sellerStats) {
    // Verified sellers get significant trust bonus (30% reduction)
    if (sellerStats.isVerified) {
      trustMultiplier *= 0.7;
    }

    // High trust score (0-100 scale assumed) - 20% reduction
    if (sellerStats.trustScore && sellerStats.trustScore > 80) {
      trustMultiplier *= 0.8;
    }

    // New sellers (0 approved listings) are more suspicious
    if (sellerStats.approvedListingsCount === 0) {
      score += 15;
      reasons.push("Yeni satıcı hesabı");
    }
  }

  // Apply trust multiplier to final score
  const finalScore = Math.round(score * trustMultiplier);

  return {
    fraudScore: Math.max(0, Math.min(finalScore, 100)),
    fraudReason: reasons.length > 0 ? reasons.join(", ") : null,
    suggestedStatus,
  };
}

/**
 * ── PILL: Issue 2 - Async AI Moderation Queue ──────────────────
 * Performs AI moderation and fraud analysis in the background.
 * Prevents blocking the main request and manages costs/retries.
 *
 * ── OPTIMIZATION: Issue #16 - N+1 Query Prevention ─────────────
 * Accepts optional listingSnapshot to avoid redundant DB fetch.
 * Caller should pass listing data when already available.
 */
export async function performAsyncModeration(listingId: string, listingSnapshot?: Listing) {
  const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const { getStoredListingById } = await import("./listing-submissions");
  const admin = createSupabaseAdminClient();

  try {
    // 1. Use provided snapshot or fetch if not available
    const listing = listingSnapshot ?? (await getStoredListingById(listingId));
    if (!listing) return;

    // 2. Fetch similar listings for market analysis (filtered for accuracy)
    const [existingListings, sellerProfile, approvedCountResult] = await Promise.all([
      getCachedFraudComparisonListings({
        brand: listing.brand,
        listingId,
        model: listing.model,
        year: listing.year,
      }),
      admin
        .from("profiles")
        .select("trust_score, is_verified")
        .eq("id", listing.sellerId)
        .maybeSingle(),
      admin
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", listing.sellerId)
        .eq("status", "approved"),
    ]);

    // 3. Compute score — explicit map to match calculateFraudScore input shape
    const fraudInput: Parameters<typeof calculateFraudScore>[0] = {
      title: listing.title,
      brand: listing.brand,
      model: listing.model,
      year: listing.year,
      mileage: listing.mileage,
      fuelType: listing.fuelType,
      transmission: listing.transmission,
      price: listing.price,
      city: listing.city,
      district: listing.district,
      description: listing.description ?? "",
      whatsappPhone: listing.whatsappPhone ?? "",
      vin: listing.vin ?? "",
      licensePlate: listing.licensePlate ?? undefined,
      tramerAmount: listing.tramerAmount ?? undefined,
      damageStatusJson: listing.damageStatusJson ?? undefined,
      expertInspection: listing.expertInspection,
      images: listing.images,
    };

    const comparisonListings = (existingListings ?? [])
      .filter((item) => item.id !== listingId)
      .map((item) => ({
        id: item.id ?? "",
        slug: item.slug ?? "",
        brand: item.brand ?? undefined,
        model: item.model ?? undefined,
        year: item.year ?? undefined,
        mileage: item.mileage ?? undefined,
        price: item.price ?? undefined,
        vin: item.vin ?? undefined,
        status: item.status ?? undefined,
      }));

    const sellerStats = {
      trustScore: sellerProfile.data?.trust_score ?? 0,
      isVerified: sellerProfile.data?.is_verified ?? false,
      approvedListingsCount: approvedCountResult.count ?? 0,
    };

    const assessment = calculateFraudScore(fraudInput, comparisonListings, sellerStats);

    // 4. Update the record
    await admin
      .from("listings")
      .update({
        fraud_score: assessment.fraudScore,
        fraud_reason: assessment.fraudReason,
        // Only update status if it was in 'pending_ai_review'
        status:
          listing.status === "pending_ai_review"
            ? (assessment.suggestedStatus ?? "approved")
            : listing.status,
      })
      .eq("id", listingId);
  } catch (error) {
    logger.listings.error("AsyncModeration failed", error, { listingId });

    // Flag listing for manual review to prevent it from staying in limbo
    try {
      await admin
        .from("listings")
        .update({
          status: "flagged",
          fraud_reason: "Otomatik moderasyon sistemi hatası - manuel inceleme gerekiyor",
          updated_at: new Date().toISOString(),
        })
        .eq("id", listingId)
        .eq("status", "pending_ai_review"); // Only update if still in review

      logger.listings.warn("Listing flagged for manual review due to moderation failure", {
        listingId,
      });
    } catch (flagError) {
      logger.listings.error("Failed to flag listing after moderation error", flagError, {
        listingId,
      });
    }
  }
}

export interface ListingTrustGuardResult {
  allowed: boolean;
  message?: string;
  reason?: string;
}

/**
 * Validate trust guard rejection attempt structure.
 */
function isValidRejectionAttempt(attempt: unknown): attempt is TrustGuardRejectionAttempt {
  if (typeof attempt !== "object" || attempt === null) return false;
  const obj = attempt as Record<string, unknown>;
  return (
    typeof obj.at === "string" &&
    (obj.source === "create" || obj.source === "edit") &&
    typeof obj.reason === "string" &&
    TRACKED_TRUST_GUARD_REASONS.has(obj.reason)
  );
}

/**
 * Validate trust guard metadata structure.
 */
function isValidTrustGuardMetadata(data: unknown): data is TrustGuardRejectionMetadata {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return Array.isArray(obj.attempts) && obj.attempts.every(isValidRejectionAttempt);
}

function parseTrustGuardMetadata(
  banReason: string | null | undefined
): TrustGuardRejectionMetadata {
  if (!banReason) {
    return { attempts: [] };
  }

  const markerIndex = banReason.indexOf(TRUST_GUARD_METADATA_PREFIX);
  if (markerIndex === -1) {
    return { attempts: [] };
  }

  const serialized = banReason.slice(markerIndex + TRUST_GUARD_METADATA_PREFIX.length).trim();
  if (!serialized) {
    return { attempts: [] };
  }

  try {
    const parsed = JSON.parse(serialized);

    // Validate structure before using
    if (!isValidTrustGuardMetadata(parsed)) {
      logger.security.warn("Invalid trust guard metadata structure", {
        serialized: serialized.slice(0, 100),
      });
      return { attempts: [] };
    }

    return {
      attempts: parsed.attempts,
      reviewReason: typeof parsed.reviewReason === "string" ? parsed.reviewReason : undefined,
      reviewRequestedAt:
        typeof parsed.reviewRequestedAt === "string" ? parsed.reviewRequestedAt : undefined,
    };
  } catch (error) {
    logger.security.error("Failed to parse trust guard metadata", error, {
      serialized: serialized.slice(0, 100),
    });
    return { attempts: [] };
  }
}

function buildTrustGuardMetadataBanReason(
  existingBanReason: string | null | undefined,
  metadata: TrustGuardRejectionMetadata
) {
  const serialized = `${TRUST_GUARD_METADATA_PREFIX}${JSON.stringify(metadata)}`;
  if (!existingBanReason) {
    return serialized;
  }

  const markerIndex = existingBanReason.indexOf(TRUST_GUARD_METADATA_PREFIX);
  if (markerIndex === -1) {
    return `${existingBanReason}\n${serialized}`;
  }

  return `${existingBanReason.slice(0, markerIndex).trimEnd()}\n${serialized}`.trim();
}

function summarizeTrustGuardAttempts(attempts: TrustGuardRejectionAttempt[]) {
  const counts = attempts.reduce<Record<string, number>>((acc, attempt) => {
    acc[attempt.reason] = (acc[attempt.reason] ?? 0) + 1;
    return acc;
  }, {});

  const labels: Record<TrustGuardRejectionAttempt["reason"], string> = {
    duplicate_plate: "mükerrer plaka",
    duplicate_vin: "mükerrer VIN",
    extreme_price_outlier: "aşırı fiyat denemesi",
  };

  return (Object.entries(counts) as [TrustGuardRejectionAttempt["reason"], number][])
    .map(([reason, count]) => `${labels[reason]} x${count}`)
    .join(", ");
}

export async function recordSellerTrustGuardRejection(input: {
  ipAddress?: string;
  sellerId: string;
  reason?: string;
  source: "create" | "edit";
}) {
  if (!hasSupabaseAdminEnv() || !input.reason || !TRACKED_TRUST_GUARD_REASONS.has(input.reason)) {
    return { restricted: false };
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_banned, ban_reason")
    .eq("id", input.sellerId)
    .maybeSingle<{ is_banned: boolean; ban_reason: string | null }>();

  if (!profile || profile.is_banned) {
    return { restricted: Boolean(profile?.is_banned) };
  }

  const now = new Date();
  const recentAttempts = parseTrustGuardMetadata(profile.ban_reason).attempts.filter((attempt) => {
    const attemptAt = new Date(attempt.at).getTime();
    return (
      Number.isFinite(attemptAt) && now.getTime() - attemptAt <= TRUST_GUARD_REJECTION_WINDOW_MS
    );
  });

  const nextAttempts: TrustGuardRejectionAttempt[] = [
    ...recentAttempts,
    {
      at: now.toISOString(),
      reason: input.reason as TrustGuardRejectionAttempt["reason"],
      source: input.source,
    },
  ];

  if (nextAttempts.length >= TRUST_GUARD_REJECTION_THRESHOLD) {
    const reviewReason = `Geçici güvenlik kısıtı: son 24 saatte tekrar eden trust-guard reddi (${summarizeTrustGuardAttempts(nextAttempts)}). Admin incelemesi gerekiyor.`;

    await admin
      .from("profiles")
      .update({
        ban_reason: buildTrustGuardMetadataBanReason(profile.ban_reason, {
          attempts: nextAttempts,
          reviewReason,
          reviewRequestedAt: now.toISOString(),
        }),
        updated_at: now.toISOString(),
      })
      .eq("id", input.sellerId);

    logger.security.warn("Trust guard threshold reached - manual review requested", {
      sellerId: input.sellerId,
      ipAddress: input.ipAddress,
      source: input.source,
      attempts: nextAttempts.length,
      reviewReason,
    });

    await createDatabaseNotification({
      href: "/dashboard/listings",
      message:
        "Hesabındaki ilan hareketleri güvenlik kontrolüne alındı. İnceleme tamamlanana kadar bazı işlemler kısıtlanabilir.",
      title: "Güvenlik incelemesi başlatıldı",
      type: "moderation",
      userId: input.sellerId,
    });

    return {
      restricted: true,
      reviewReason,
    };
  }

  await admin
    .from("profiles")
    .update({
      ban_reason: buildTrustGuardMetadataBanReason(profile.ban_reason, { attempts: nextAttempts }),
      updated_at: now.toISOString(),
    })
    .eq("id", input.sellerId);

  return {
    restricted: false,
    attemptCount: nextAttempts.length,
  };
}

export async function runListingTrustGuards(
  input: ListingCreateInput,
  options?: {
    excludeListingId?: string;
  }
): Promise<ListingTrustGuardResult> {
  if (!hasSupabaseAdminEnv()) {
    return { allowed: true };
  }

  const admin = createSupabaseAdminClient();

  // VIN validation: only check if VIN is valid (non-empty and >= 17 chars)
  const shouldCheckVin = input.vin && input.vin.trim().length >= 17;
  const vinDuplicateResult = shouldCheckVin
    ? await admin
        .from("listings")
        .select("id", { head: true, count: "exact" })
        .eq("vin", input.vin.trim())
        .neq("id", options?.excludeListingId ?? "")
        .in("status", ["pending", "pending_ai_review", "approved", "flagged"])
    : { count: 0, error: null };

  // License plate validation: only check if plate exists
  const shouldCheckPlate = input.licensePlate && input.licensePlate.trim().length > 0;
  const plateDuplicateResult = shouldCheckPlate
    ? await admin
        .from("listings")
        .select("id", { head: true, count: "exact" })
        .eq("license_plate", input.licensePlate!.trim()) // Non-null assertion safe here
        .neq("id", options?.excludeListingId ?? "")
        .in("status", ["pending", "pending_ai_review", "approved", "flagged"])
    : { count: 0, error: null };

  const priceEstimate = await estimateVehiclePrice({
    brand: input.brand,
    model: input.model,
    year: input.year,
    mileage: input.mileage,
    carTrim: input.carTrim ?? null,
    tramerAmount: input.tramerAmount ?? null,
    damageStatusJson: input.damageStatusJson ?? null,
  });

  if ((vinDuplicateResult.count ?? 0) > 0) {
    return {
      allowed: false,
      reason: "duplicate_vin",
      message: "Bu şasi numarasıyla aktif veya incelemede başka bir ilan zaten mevcut.",
    };
  }

  if ((plateDuplicateResult.count ?? 0) > 0) {
    return {
      allowed: false,
      reason: "duplicate_plate",
      message: "Bu plaka ile aktif veya incelemede başka bir ilan zaten mevcut.",
    };
  }

  if (priceEstimate && priceEstimate.listingCount >= 5 && priceEstimate.avg > 0) {
    const priceRatio = input.price / priceEstimate.avg;

    if (
      priceRatio < PRICE_ANOMALY_THRESHOLDS.TRUST_GUARD_LOW ||
      priceRatio > PRICE_ANOMALY_THRESHOLDS.TRUST_GUARD_HIGH
    ) {
      // Issue #30: Show expected price range to user
      const minAcceptable = Math.round(
        priceEstimate.avg * PRICE_ANOMALY_THRESHOLDS.TRUST_GUARD_LOW
      );
      const maxAcceptable = Math.round(
        priceEstimate.avg * PRICE_ANOMALY_THRESHOLDS.TRUST_GUARD_HIGH
      );
      const avgPrice = Math.round(priceEstimate.avg);

      return {
        allowed: false,
        reason: "extreme_price_outlier",
        message:
          `Girilen fiyat (${input.price.toLocaleString("tr-TR")} TL) piyasa ortalamasının (${avgPrice.toLocaleString("tr-TR")} TL) çok dışında. ` +
          `Kabul edilen aralık: ${minAcceptable.toLocaleString("tr-TR")} - ${maxAcceptable.toLocaleString("tr-TR")} TL. ` +
          `Fiyatınız doğruysa lütfen destek ekibiyle iletişime geçin.`,
      };
    }
  }

  return { allowed: true };
}
