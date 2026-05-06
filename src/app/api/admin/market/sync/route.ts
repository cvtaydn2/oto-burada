/**
 * POST /api/admin/market/sync  (admin-triggered)
 * GET  /api/admin/market/sync  (Vercel Cron)
 *
 * Recalculates market_stats for all active listing segments.
 * Updates market_price_index on all approved listings.
 *
 * Security: admin auth OR CRON_SECRET header.
 */

import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/api/response";
import { withCronOrAdmin } from "@/lib/api/security";
import { logger } from "@/lib/logging/logger";
import { captureServerEvent } from "@/lib/monitoring/telemetry-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

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
  const adminUser = security.user; // Might be null if it's a cron job

  if (!hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
  }

  const admin = createSupabaseAdminClient();

  // PERF: fetch approved listings once and aggregate in-memory
  const { data: approvedListings, error: segErr } = await admin
    .from("listings")
    .select("brand, model, year, price")
    .eq("status", "approved")
    .not("price", "is", null);

  if (segErr || !approvedListings) {
    logger.market.error("Market sync: failed to fetch approved listings", segErr);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Segment verisi alınamadı.", 500);
  }

  const segmentStats = new Map<
    string,
    { brand: string; model: string; year: number; sumPrice: number; count: number }
  >();

  for (const listing of approvedListings) {
    const brand = listing.brand as string;
    const model = listing.model as string;
    const year = listing.year as number;
    const price = Number(listing.price);

    if (!brand || !model || !year || !Number.isFinite(price) || price <= 0) {
      continue;
    }

    const key = `${brand}|${model}|${year}`;
    const existing = segmentStats.get(key);

    if (existing) {
      existing.sumPrice += price;
      existing.count += 1;
    } else {
      segmentStats.set(key, {
        brand,
        model,
        year,
        sumPrice: price,
        count: 1,
      });
    }
  }

  let updated = 0;
  let failed = 0;

  for (const seg of segmentStats.values()) {
    try {
      const avgPrice = seg.sumPrice / seg.count;

      const { error: upsertErr } = await admin.rpc("upsert_market_stats", {
        p_brand: seg.brand,
        p_model: seg.model,
        p_year: seg.year,
        p_avg_price: avgPrice,
        p_listing_count: seg.count,
      });

      if (upsertErr) {
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
          listing_count: seg.count,
          calculated_at: new Date().toISOString(),
        });
      }

      await admin.rpc("update_listing_price_indices", {
        p_brand: seg.brand,
        p_model: seg.model,
        p_year: seg.year,
        p_avg_price: avgPrice,
      });

      updated++;
    } catch (err) {
      logger.market.error("Market sync: segment failed", err, {
        brand: seg.brand,
        model: seg.model,
        year: seg.year,
      });
      failed++;
    }
  }

  captureServerEvent(
    "market_stats_synced",
    {
      adminUserId: adminUser?.id ?? "cron",
      totalSegments: segmentStats.size,
      updated,
      failed,
    },
    adminUser?.id ?? "server"
  );

  return apiSuccess(
    { totalSegments: segmentStats.size, updated, failed },
    `${updated} segment güncellendi.`
  );
}
