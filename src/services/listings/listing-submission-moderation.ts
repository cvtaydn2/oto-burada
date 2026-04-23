import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { logger } from "@/lib/utils/logger";
import { estimateVehiclePrice } from "@/services/market/price-estimation";
import { Listing, ListingCreateInput } from "@/types";

const TRUST_GUARD_REJECTION_WINDOW_MS = 24 * 60 * 60 * 1000;
const TRUST_GUARD_REJECTION_THRESHOLD = 3;
const TRUST_GUARD_METADATA_PREFIX = "[AUTO_TRUST_GUARD]";
const TRACKED_TRUST_GUARD_REASONS = new Set([
  "duplicate_vin",
  "duplicate_plate",
  "extreme_price_outlier",
]);

interface TrustGuardRejectionAttempt {
  at: string;
  reason: "duplicate_vin" | "duplicate_plate" | "extreme_price_outlier";
  source: "create" | "edit";
}

interface TrustGuardRejectionMetadata {
  attempts: TrustGuardRejectionAttempt[];
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
  }[]
): { fraudScore: number; fraudReason: string | null; suggestedStatus?: Listing["status"] } {
  let score = 0;
  const reasons: string[] = [];
  let suggestedStatus: Listing["status"] | undefined = undefined;

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

  const vinDuplicate = input.vin
    ? existingListings.find(
        (l) => l.vin === input.vin && l.status !== "archived" && l.status !== "rejected"
      )
    : undefined;
  if (vinDuplicate) {
    score += 100;
    reasons.push("Aynı şasi numaralı başka bir aktif ilan mevcut (VIN clone)");
  }

  // --- ANOMALY DETECTOR LOGIC ---
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

    if (input.price < avgPrice * 0.7) {
      score += 70;
      reasons.push(`Fiyat ortalamanın %30 altında (${Math.round(avgPrice)} TL)`);
      suggestedStatus = "flagged";
    } else if (input.price > avgPrice * 1.5) {
      score += 50;
      reasons.push(`Fiyat ortalamanın %50 üzerinde (${Math.round(avgPrice)} TL)`);
      suggestedStatus = "flagged";
    }
  } else {
    if (input.year >= 2020 && input.price < 800_000) {
      score += 60;
      reasons.push("Pazar ortalamasının çok altında şüpheli fiyat");
    }
  }

  const vehicleAge = new Date().getFullYear() - input.year;
  if (vehicleAge >= 10 && input.mileage < 10000) {
    score += 40;
    reasons.push("mileage_anomaly");
    suggestedStatus = suggestedStatus || "flagged";
  }

  if (input.damageStatusJson && input.tramerAmount === 0) {
    const suspiciousStatuses = ["boyali", "lokal_boyali", "degisen"];
    const changedPartsCount = Object.values(input.damageStatusJson).filter((s) =>
      suspiciousStatuses.includes(s as string)
    ).length;

    if (changedPartsCount >= 3) {
      score += 20;
      reasons.push("Çoklu boya/değişen kaydına rağmen hasar kaydı 0");
    }
  }

  return {
    fraudScore: Math.min(score, 100),
    fraudReason: reasons.length > 0 ? reasons.join(", ") : null,
    suggestedStatus,
  };
}

/**
 * ── PILL: Issue 2 - Async AI Moderation Queue ──────────────────
 * Performs AI moderation and fraud analysis in the background.
 * Prevents blocking the main request and manages costs/retries.
 */
export async function performAsyncModeration(listingId: string) {
  const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const { getStoredListingById } = await import("./listing-submissions");
  const admin = createSupabaseAdminClient();

  try {
    // 1. Fetch current listing
    const listing = await getStoredListingById(listingId);
    if (!listing) return;

    // 2. Fetch similar listings for market analysis (filtered for accuracy)
    const { data: existingListings } = await admin
      .from("listings")
      .select("id, slug, brand, model, year, mileage, price, vin, status")
      .eq("brand", listing.brand)
      .eq("model", listing.model)
      .neq("id", listingId)
      .limit(100);

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

    const comparisonListings = (existingListings ?? []).map((item) => ({
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

    const assessment = calculateFraudScore(fraudInput, comparisonListings);

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
  }
}

export interface ListingTrustGuardResult {
  allowed: boolean;
  message?: string;
  reason?: string;
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
    const parsed = JSON.parse(serialized) as { attempts?: TrustGuardRejectionAttempt[] };
    return {
      attempts: Array.isArray(parsed.attempts)
        ? parsed.attempts.filter(
            (attempt): attempt is TrustGuardRejectionAttempt =>
              typeof attempt?.at === "string" &&
              (attempt.source === "create" || attempt.source === "edit") &&
              typeof attempt.reason === "string" &&
              TRACKED_TRUST_GUARD_REASONS.has(attempt.reason)
          )
        : [],
    };
  } catch {
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
        is_banned: true,
        ban_reason: reviewReason,
        updated_at: now.toISOString(),
      })
      .eq("id", input.sellerId);

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

  const [vinDuplicateResult, plateDuplicateResult, priceEstimate] = await Promise.all([
    admin
      .from("listings")
      .select("id", { head: true, count: "exact" })
      .eq("vin", input.vin)
      .neq("id", options?.excludeListingId ?? "")
      .in("status", ["pending", "pending_ai_review", "approved", "flagged"]),
    input.licensePlate
      ? admin
          .from("listings")
          .select("id", { head: true, count: "exact" })
          .eq("license_plate", input.licensePlate)
          .neq("id", options?.excludeListingId ?? "")
          .in("status", ["pending", "pending_ai_review", "approved", "flagged"])
      : Promise.resolve(null),
    estimateVehiclePrice({
      brand: input.brand,
      model: input.model,
      year: input.year,
      mileage: input.mileage,
      carTrim: input.carTrim ?? null,
      tramerAmount: input.tramerAmount ?? null,
      damageStatusJson: input.damageStatusJson ?? null,
    }),
  ]);

  if ((vinDuplicateResult.count ?? 0) > 0) {
    return {
      allowed: false,
      reason: "duplicate_vin",
      message: "Bu şasi numarasıyla aktif veya incelemede başka bir ilan zaten mevcut.",
    };
  }

  if (input.licensePlate && (plateDuplicateResult?.count ?? 0) > 0) {
    return {
      allowed: false,
      reason: "duplicate_plate",
      message: "Bu plaka ile aktif veya incelemede başka bir ilan zaten mevcut.",
    };
  }

  if (priceEstimate && priceEstimate.listingCount >= 5 && priceEstimate.avg > 0) {
    const priceRatio = input.price / priceEstimate.avg;

    if (priceRatio < 0.45 || priceRatio > 2.2) {
      return {
        allowed: false,
        reason: "extreme_price_outlier",
        message:
          "Girilen fiyat piyasa dengesinin aşırı dışında. Lütfen fiyatı kontrol edip tekrar gönder.",
      };
    }
  }

  return { allowed: true };
}
