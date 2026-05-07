import { NextRequest, NextResponse } from "next/server";

import { withUserRoute } from "@/features/shared/lib/security";
import { createSupabaseServerClient } from "@/features/shared/lib/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const security = await withUserRoute(req);
    if (!security.ok) return security.response;

    const user = security.user!;
    const { token } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: payment, error } = await supabase
      .from("payments")
      .select("status, amount, created_at, listing_id")
      .eq("iyzico_token", token)
      .eq("user_id", user.id)
      .single();

    if (error || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({ data: payment });
  } catch {
    return NextResponse.json({ error: "Ödeme bilgileri alınamadı." }, { status: 500 });
  }
}
