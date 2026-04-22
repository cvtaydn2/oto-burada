/**
 * POST /api/admin/market/sync  (admin-triggered)
 * GET  /api/admin/market/sync  (Vercel Cron)
 *
 * Recalculates market_stats for all active listing segments.
 * Updates market_price_index on all approved listings.
 *
 * Security: admin auth OR CRON_SECRET header.
 */

import { captureServerEvent } from "@/lib/monitoring/posthog-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/utils/api-response";
import { withCronOrAdmin } from "@/lib/utils/api-security";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleSync(request);
}

export async function POST(request: Request) {
  return handleSync(request);
}

async function handleSync(request: Request) {
  const security = await withCronOrAdmin(request);
  if (!security.ok) return security.response;

  if (!hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
  }

  const admin = createSupabaseAdminClient();

  // Get all unique brand/model/year segments from approved listings
  const { data: segments, error: segErr } = await admin
    .from("listings")
    .select("brand, model, year")
    .eq("status", "approved");

  if (segErr || !segments) {
    logger.market.error("Market sync: failed to fetch segments", segErr);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Segment verisi alınamadı.", 500);
  }

  // Deduplicate
  const uniqueSegments = new Map<string, { brand: string; model: string; year: number }>();
  for (const s of segments) {
    const key = `${s.brand}|${s.model}|${s.year}`;
    if (!uniqueSegments.has(key)) {
      uniqueSegments.set(key, {
        brand: s.brand as string,
        model: s.model as string,
        year: s.year as number,
      });
    }
  }

  let updated = 0;
  let failed = 0;

  for (const seg of uniqueSegments.values()) {
    try {
      // Calculate average price for this segment
      const { data: prices } = await admin
        .from("listings")
        .select("price")
        .eq("brand", seg.brand)
        .eq("model", seg.model)
        .eq("year", seg.year)
        .eq("status", "approved");

      if (!prices || prices.length === 0) continue;

      const avgPrice = prices.reduce((sum, p) => sum + Number(p.price), 0) / prices.length;

      // Upsert market_stats — partial index üzerinden çalışmaz,
      // manuel INSERT ... ON CONFLICT kullan
      const { error: upsertErr } = await admin.rpc("upsert_market_stats", {
        p_brand: seg.brand,
        p_model: seg.model,
        p_year: seg.year,
        p_avg_price: avgPrice,
        p_listing_count: prices.length,
      });

      if (upsertErr) {
        // RPC yoksa fallback: delete + insert
        await admin
          .from("market_stats")
          .delete()
          .eq("brand", seg.brand)
          .eq("model", seg.model)
          .eq("year", seg.year)
          .is("car_trim", null);

        await admin.from("market_stats").insert({
          brand: seg.brand,
          model: seg.model,
          year: seg.year,
          avg_price: avgPrice,
          listing_count: prices.length,
          calculated_at: new Date().toISOString(),
        });
      }

      // Update market_price_index on all listings in this segment
      await admin.rpc("update_listing_price_indices", {
        p_brand: seg.brand,
        p_model: seg.model,
        p_year: seg.year,
        p_avg_price: avgPrice,
      });

      updated++;
    } catch (err) {
      logger.market.error("Market sync: segment failed", err, seg);
      failed++;
    }
  }

  captureServerEvent("market_stats_synced", {
    totalSegments: uniqueSegments.size,
    updated,
    failed,
  });

  return apiSuccess(
    { totalSegments: uniqueSegments.size, updated, failed },
    `${updated} segment güncellendi.`
  );
}
