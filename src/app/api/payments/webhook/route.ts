/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

import { verifyIyzicoWebhook } from "@/lib/api/iyzico-webhook";
import { logger } from "@/lib/logging/logger";
import { secrets } from "@/lib/security/secrets";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const admin = createSupabaseAdminClient();

  try {
    // ── BUG FIX: Issue BUG-08 - JSON Parse Error Handling ─────────────
    // Catch JSON parse errors to prevent 500 errors on malformed payloads
    // and avoid unnecessary Iyzico retries
    const rawBody = await req.text();
    let body: any;

    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      logger.api.warn("Invalid JSON in webhook payload", {
        error: parseError instanceof Error ? parseError.message : "Unknown parse error",
      });
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // 1. SECURITY: Verify Iyzico webhook signature FIRST
    const signature = req.headers.get("x-iyzi-signature");
    const secretKey = secrets.payments().secretKey;

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
    // Use upsert with token as unique key for idempotency
    const SAFE_HEADERS = ["content-type", "x-iyzi-event-type", "user-agent"] as const;
    const safeHeaders = Object.fromEntries(
      [...req.headers.entries()].filter(([key]) => SAFE_HEADERS.includes(key.toLowerCase() as any))
    );

    // Idempotent logging - prevent duplicate logs for retried webhooks
    await admin.from("payment_webhook_logs").upsert(
      {
        token: body.token, // Unique identifier from Iyzico
        payload: body,
        headers: safeHeaders,
        status: "received",
        received_at: new Date().toISOString(),
      },
      { onConflict: "token", ignoreDuplicates: false }
    );

    // 3. Update payment status with atomic lock for idempotency (F-01)
    if (body.iyziEventType === "PAYMENT_AUTH") {
      const token = body.token;
      const status = body.status === "SUCCESS" ? "success" : "failure";

      // 3. Process payment with atomic RPC (F-01, F-04)
      const { data: result, error: rpcError } = await admin.rpc("process_payment_webhook", {
        p_token: token,
        p_status: status,
        p_iyzico_payment_id: body.paymentId,
      });

      if (rpcError) {
        logger.api.error("RPC: process_payment_webhook failed", {
          token,
          error: rpcError.message,
        });
        return NextResponse.json({ status: "error", message: rpcError.message }, { status: 500 });
      }

      if (result?.status === "already_processed") {
        logger.api.info("Payment already processed (idempotent)", { token });
        return NextResponse.json({ status: "already_processed" });
      }

      if (result?.status === "not_found") {
        logger.api.warn("Payment record not found for webhook", { token });
        return NextResponse.json({ status: "not_found" }, { status: 404 });
      }

      logger.api.info("Payment webhook processed atomically", {
        token,
        status,
        paymentId: result?.payment_id,
        jobId: result?.job_id,
      });
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
