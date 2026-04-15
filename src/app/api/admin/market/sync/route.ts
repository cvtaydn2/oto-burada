import { NextResponse } from "next/server";
import { requireApiAdminUser } from "@/lib/auth/api-admin";
import { aggregateMarketStats } from "@/services/admin/market-aggregator";

export async function POST() {
  const authResponse = await requireApiAdminUser();
  if (authResponse instanceof Response) return authResponse;

  try {
    const result = await aggregateMarketStats();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
