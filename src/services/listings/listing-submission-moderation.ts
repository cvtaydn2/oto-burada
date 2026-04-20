/* eslint-disable @typescript-eslint/no-explicit-any */
import { Listing, ListingCreateInput } from "@/types";

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
    (l) => l.brand === input.brand && l.model === input.model && l.year === input.year && l.price && l.price > 0
  );

  if (similarListings.length >= 3) {
    const avgPrice = similarListings.reduce((sum, current) => sum + (current.price || 0), 0) / similarListings.length;
    
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
    suggestedStatus
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

    // 2. Fetch similar listings for market analysis (expensive part)
    const { data: existingListings } = await admin
      .from("listings")
      .select("id, slug, brand, model, year, mileage, price, vin, status")
      .neq("id", listingId)
      .limit(100);

    // 3. Compute score
    const assessment = calculateFraudScore(listing as any, (existingListings || []) as any);

    // 4. Update the record
    await admin
      .from("listings")
      .update({
        fraud_score: assessment.fraudScore,
        fraud_reason: assessment.fraudReason,
        // Only update status if it was in 'pending_ai_review'
        status: listing.status === "pending_ai_review" 
          ? (assessment.suggestedStatus ?? "approved") 
          : listing.status
      })
      .eq("id", listingId);

  } catch (error) {
    console.error(`[AsyncModeration] Failed for ${listingId}:`, error);
  }
}
