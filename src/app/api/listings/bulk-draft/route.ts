import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { enforceRateLimit, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";

// Bulk draft: 20 per hour per user
const BULK_DRAFT_RATE_LIMIT = { limit: 20, windowMs: 60 * 60 * 1000 };

export async function POST(req: Request) {
  try {
    const user = await requireApiUser();
    if (user instanceof Response) {
      return user;
    }

    const rateLimit = await enforceRateLimit(
      getUserRateLimitKey(user.id, "api:listings:bulk-draft"),
      BULK_DRAFT_RATE_LIMIT,
    );
    if (rateLimit) return rateLimit.response;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, message: "İstek gövdesi okunamadı." }, { status: 400 });
    }

    const { ids } = body as { ids?: unknown };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, message: "Geçersiz ID listesi." }, { status: 400 });
    }

    if (ids.length > 50) {
      return NextResponse.json({ success: false, message: "En fazla 50 ilan taslağa çekilebilir." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("listings")
      .update({ status: "draft", updated_at: new Date().toISOString() })
      .in("id", ids.map(String))
      .eq("seller_id", user.id);

    if (error) {
      logger.listings.error("Bulk draft DB error", error, { userId: user.id, count: ids.length });
      captureServerError("Bulk draft DB error", "listings", error, { userId: user.id });
      return NextResponse.json({ success: false, message: "İşlem sırasında bir hata oluştu." }, { status: 500 });
    }

    captureServerEvent("listings_bulk_drafted", {
      userId: user.id,
      count: ids.length,
    }, user.id);

    return NextResponse.json({ success: true, message: "İlanlar taslağa çekildi." });
  } catch (error) {
    logger.listings.error("Bulk draft failed", error);
    captureServerError("Bulk draft failed", "listings", error);
    const message = error instanceof Error ? error.message : "İşlem sırasında bir hata oluştu.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
