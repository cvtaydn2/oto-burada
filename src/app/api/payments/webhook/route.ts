/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyIyzicoWebhook } from "@/lib/utils/iyzico-webhook";
import { logger } from "@/lib/utils/logger";

export async function POST(req: NextRequest) {
  const admin = createSupabaseAdminClient();

  try {
    // Get raw body for signature verification
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    // 1. Log the webhook (before verification for audit trail)
    await admin.from("payment_webhook_logs").insert({
      payload: body,
      headers: Object.fromEntries(req.headers.entries()),
      status: "received",
    });

    // 2. SECURITY: Verify Iyzico webhook signature
    const signature = req.headers.get("x-iyzi-signature");
    const secretKey = process.env.IYZICO_SECRET_KEY;

    if (!secretKey) {
      logger.api.error("Iyzico secret key not configured");
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    const isValid = verifyIyzicoWebhook(rawBody, signature, secretKey);

    if (!isValid) {
      logger.api.warn("Invalid Iyzico webhook signature", {
        hasSignature: !!signature,
        eventType: body.iyziEventType,
      });

      // Update log status
      await admin
        .from("payment_webhook_logs")
        .update({ status: "invalid_signature" })
        .eq("payload->token", body.token);

      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // 3. Update payment status if needed
    if (body.iyziEventType === "PAYMENT_AUTH") {
      const token = body.token;
      const status = body.status === "SUCCESS" ? "success" : "failure";

      // First, get current webhook_attempts
      const { data: currentPayment } = await admin
        .from("payments")
        .select("webhook_attempts")
        .eq("iyzico_token", token)
        .single();

      const { error: updateError } = await admin
        .from("payments")
        .update({
          status: status,
          iyzico_payment_id: body.paymentId,
          processed_at: new Date().toISOString(),
          webhook_attempts: (currentPayment?.webhook_attempts || 0) + 1,
        })
        .eq("iyzico_token", token);

      if (updateError) {
        logger.api.error("Failed to update payment from webhook", {
          token,
          error: updateError.message,
        });
        throw updateError;
      }

      // Update log status
      await admin
        .from("payment_webhook_logs")
        .update({ status: "processed" })
        .eq("payload->token", token);

      logger.api.info("Payment webhook processed", { token, status });
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    logger.api.error("Payment webhook error", {}, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
