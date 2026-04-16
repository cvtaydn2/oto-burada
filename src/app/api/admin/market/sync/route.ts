import { NextResponse } from "next/server";
import { requireApiAdminUser } from "@/lib/auth/api-admin";
import { aggregateMarketStats } from "@/services/admin/market-aggregator";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";

export async function POST() {
  const authResponse = await requireApiAdminUser();
  if (authResponse instanceof Response) return authResponse;

  try {
    const result = await aggregateMarketStats();

    if (!result.success) {
      captureServerEvent("admin_market_sync_failed", {
        adminUserId: authResponse.id,
        error: result.error,
      }, authResponse.id);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    captureServerEvent("admin_market_sync_completed", {
      adminUserId: authResponse.id,
    }, authResponse.id);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    captureServerError("Admin market sync unexpected error", "admin", error, {
      adminUserId: authResponse.id,
    }, authResponse.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
