/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

import { verifyIyzicoWebhook } from "@/lib/api/iyzico-webhook";
import { logger } from "@/lib/logging/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const admin = createSupabaseAdminClient();

  try {
    // Get raw body for signature verification
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    // 1. SECURITY: Verify Iyzico webhook signature FIRST
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
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // 2. Log ONLY verified webhooks with safe headers (F-02)
    const SAFE_HEADERS = ["content-type", "x-iyzi-event-type", "user-agent"] as const;
    const safeHeaders = Object.fromEntries(
      [...req.headers.entries()].filter(([key]) => SAFE_HEADERS.includes(key.toLowerCase() as any))
    );

    await admin.from("payment_webhook_logs").insert({
      payload: body,
      headers: safeHeaders,
      status: "received",
    });

    // 3. Update payment status with atomic lock for idempotency (F-01)
    if (body.iyziEventType === "PAYMENT_AUTH") {
      const token = body.token;
      const status = body.status === "SUCCESS" ? "success" : "failure";

      // Atomic lock: Only one worker can set webhook_processed_at to non-null
      const { data: locked, error: lockError } = await admin
        .from("payments")
        .update({
          status: status,
          iyzico_payment_id: body.paymentId,
          processed_at: new Date().toISOString(),
          webhook_processed_at: new Date().toISOString(),
        })
        .eq("iyzico_token", token)
        .is("webhook_processed_at", null) // Atomic check
        .select("id, user_id, listing_id, package_id")
        .single();

      if (lockError || !locked) {
        // Already processed or error — respond 200 for idempotency
        logger.api.info("Payment already processed or lock failed", { token });
        return NextResponse.json({ status: "already_processed" });
      }

      // 4. Queue fulfillment instead of doing side effects inside the webhook.
      if (status === "success" && locked.listing_id && locked.package_id) {
        const { error: jobError } = await admin.rpc("create_fulfillment_job", {
          p_payment_id: locked.id,
          p_job_type: "doping_apply",
          p_metadata: {
            listing_id: locked.listing_id,
            package_id: locked.package_id,
            user_id: locked.user_id,
          },
        });

        if (jobError) {
          await admin.from("payments").update({ webhook_processed_at: null }).eq("id", locked.id);

          logger.api.error("Failed to queue doping fulfillment job", {
            paymentId: locked.id,
            error: jobError.message,
          });
          return NextResponse.json({ status: "queued_failed" }, { status: 500 });
        }
      }

      // Increment attempt counter (now that the RPC exists in DB)
      await admin.rpc("increment_webhook_attempts", { p_token: token });

      // Update log status (use filter for jsonb column)
      await admin
        .from("payment_webhook_logs")
        .update({ status: "processed" })
        .filter("payload->>token", "eq", token);

      logger.api.info("Payment webhook processed successfully", { token, status });
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    logger.api.error("Payment webhook error", { message: error.message });
    // F-08: Return generic message to prevent information disclosure
    return NextResponse.json(
      { status: "error", message: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
