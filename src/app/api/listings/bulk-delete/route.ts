import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { deleteDatabaseListing } from "@/services/listings/listing-submissions";
import { logger } from "@/lib/utils/logger";
import { captureServerError } from "@/lib/monitoring/posthog-server";
import { enforceRateLimit, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";

// Bulk delete: 10 per hour per user
const BULK_DELETE_RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 };

export async function POST(req: Request) {
  try {
    const user = await requireUser();

    const rateLimit = await enforceRateLimit(
      getUserRateLimitKey(user.id, "api:listings:bulk-delete"),
      BULK_DELETE_RATE_LIMIT,
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
      return NextResponse.json({ success: false, message: "En fazla 50 ilan silinebilir." }, { status: 400 });
    }

    const results = await Promise.all(
      ids.map((id) => deleteDatabaseListing(String(id), user.id)),
    );

    const successCount = results.filter(Boolean).length;

    return NextResponse.json({
      success: true,
      message: `${successCount} ilan başarıyla silindi.`,
      count: successCount,
    });
  } catch (error) {
    logger.listings.error("Bulk delete failed", error);
    captureServerError("Bulk delete failed", "listings", error);
    const message = error instanceof Error ? error.message : "İşlem sırasında bir hata oluştu.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
