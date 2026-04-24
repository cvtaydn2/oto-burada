/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const admin = createSupabaseAdminClient();

    // Iyzico Webhook Logic
    // 1. Log the webhook
    await admin.from("payment_webhook_logs").insert({
      payload: body,
      headers: Object.fromEntries(req.headers.entries()),
      status: "received",
    });

    // 2. Validate signature if possible (Iyzico uses a specific header)
    // For now, we'll implement basic processing

    // 3. Update payment status if needed
    if (body.iyziEventType === "PAYMENT_AUTH") {
      const token = body.token;
      const status = body.status === "SUCCESS" ? "success" : "failure";

      await admin
        .from("payments")
        .update({
          status: status,
          iyzico_payment_id: body.paymentId,
          processed_at: new Date().toISOString(),
        })
        .eq("iyzico_token", token);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("[PaymentWebhook] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
