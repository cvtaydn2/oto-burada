import { NextResponse } from "next/server";
import { getCurrentUser, getUserRole } from "@/lib/auth/session";
import { aggregateMarketStats } from "@/services/admin/market-aggregator";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || getUserRole(user) !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await aggregateMarketStats();
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: result.message 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
