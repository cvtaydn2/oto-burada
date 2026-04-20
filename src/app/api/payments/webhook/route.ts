/**
 * POST /api/payments/webhook
 *
 * Iyzico payment notification webhook.
 * Iyzico calls this endpoint after every payment attempt (success or failure).
 *
 * Security:
 * - Verifies the HMAC-SHA256 signature from Iyzico using IYZICO_SECRET_KEY
 * - Idempotent: uses payment token as dedup key — safe to call multiple times
 * - No auth required (called by Iyzico servers, not users)
 *
 * Flow:
 * 1. Verify signature
 * 2. Parse payment result
 * 3. Upsert payment record (idempotent)
 * 4. If success: credit user OR apply doping
 * 5. Send notification to user
 *
 * Iyzico webhook docs:
 * https://dev.iyzipay.com/tr/webhook
 */

import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { logger } from "@/lib/utils/logger";
import { runFulfillmentForPayment } from "@/services/billing/fulfillment-worker";

export const dynamic = "force-dynamic";

// Iyzico sends form-encoded body, not JSON
export const runtime = "nodejs";

interface IyzicoWebhookPayload {
  /** Iyzico payment token — unique per payment attempt */
  token: string;
  /** "SUCCESS" | "FAILURE" | "INIT_THREEDS" | "CALLBACK_THREEDS" */
  status: string;
  /** Iyzico payment ID (only on success) */
  paymentId?: string;
  /** Our order ID passed during payment init */
  merchantOrderId?: string;
  /** Conversation ID we passed during init */
  conversationId?: string;
}

/**
 * Verify Iyzico webhook signature.
 * Iyzico sends: X-IYZ-SIGNATURE header = HMAC-SHA256(secretKey + token)
 */
function verifyIyzicoSignature(
  token: string,
  signature: string,
  secretKey: string,
): boolean {
  const expected = createHmac("sha256", secretKey)
    .update(token)
    .digest("hex");
  // Constant-time comparison to prevent timing attacks
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const secretKey = process.env.IYZICO_SECRET_KEY;
  if (!secretKey) {
    logger.payments.error("IYZICO_SECRET_KEY not set — webhook rejected");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const startTime = Date.now();
  const rawHeaders = Object.fromEntries(request.headers.entries());
  
  // ── 1. Parse Request ───────────────────────────────────────────────────
  let payload: IyzicoWebhookPayload;
  let rawBody = "";
  try {
    rawBody = await request.text();
    const params = new URLSearchParams(rawBody);
    payload = {
      token: params.get("token") ?? "",
      status: params.get("status") ?? "",
      paymentId: params.get("paymentId") ?? undefined,
      merchantOrderId: params.get("merchantOrderId") ?? undefined,
      conversationId: params.get("conversationId") ?? undefined,
    };
  } catch (err) {
    logger.payments.error("Webhook body parse failed", err);
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const token = payload.token;
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

  // Helper for audit logging
  const logWebhookAttempt = async (status: string, errorMsg?: string) => {
    try {
      await admin.from("payment_webhook_logs").insert({
        token,
        payload: payload as unknown as Record<string, unknown>,
        headers: rawHeaders,
        status,
        error_message: errorMsg,
        processing_ms: Date.now() - startTime,
        ip_address: ip,
      });
    } catch (err) {
      console.error("[WebhookAudit] Failed to save log:", err);
    }
  };

  // ── 2. Security Checks ──────────────────────────────────────────────────
  const signature = request.headers.get("x-iyz-signature");
  if (!signature) {
    await logWebhookAttempt("invalid_signature", "Missing x-iyz-signature");
    logger.payments.warn("Webhook rejected: missing x-iyz-signature header", { token });
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  if (!verifyIyzicoSignature(token, signature, secretKey)) {
    await logWebhookAttempt("invalid_signature", "Signature mismatch");
    logger.payments.warn("Webhook rejected: signature mismatch", { token });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ── 3. Processing ───────────────────────────────────────────────────────
  const isSuccess = payload.status === "SUCCESS";
  
  try {
    const { data: result, error: rpcError } = await admin.rpc("process_payment_webhook", {
      p_iyzico_token: token,
      p_status: payload.status,
      p_iyzico_payment_id: payload.paymentId ?? null,
    });

    if (rpcError) {
      await logWebhookAttempt("error", `RPC Fail: ${rpcError.message}`);
      logger.payments.error("Webhook RPC failed", rpcError, { token });
      return NextResponse.json({ received: true, error: true });
    }

    if (result?.idempotent) {
      await logWebhookAttempt("processed", "Idempotent hit");
      logger.payments.info("Webhook already processed (idempotent)", { token });
      return NextResponse.json({ received: true, idempotent: true });
    }

    if (result?.orphan) {
      await logWebhookAttempt("processed", "Orphan record created");
      logger.payments.warn("Webhook created orphan record", { token });
      return NextResponse.json({ received: true, orphan: true });
    }

    // Success processing... (await fulfillment and then log "processed")
    // Note: I'll log "processed" at the very end of success block

    // ── Post-payment actions (success only) ─────────────────────────────────
    // These are non-critical actions that happen AFTER payment is processed
    // If they fail, payment is still successful (already committed in DB)
    
    if (isSuccess && result?.success) {
      try {
        // Run fulfillment jobs immediately (no 24h cron wait)
        // Note: The trigger public.trigger_create_fulfillment_jobs() already created the jobs.
        await runFulfillmentForPayment(result.payment_id);
      } catch (err) {
        logger.payments.error("Post-payment fulfillment failed in webhook", err, { token: payload.token });
      }
    }

    await logWebhookAttempt("processed", isSuccess ? "Payment success" : "Payment failure recorded");
    return NextResponse.json({ received: true, success: result?.success });

  } catch (err) {
    // Unexpected error in webhook processing
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    await logWebhookAttempt("error", `System Error: ${errMsg}`);
    logger.payments.error("Webhook processing unexpected error", err, { token });
    
    return NextResponse.json({ received: true, error: true });
  }

  // ── Redirect for browser requests ────────────────────────────────────────
  // If the request was made by a browser (e.g. Iyzico POSTing back after 3DS),
  // redirect the user to a friendly result page instead of showing JSON.
  const accept = request.headers.get("accept");
  if (accept?.includes("text/html")) {
    const origin = new URL(request.url).origin;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
    const resultUrl = new URL("/dashboard/payments/result", baseUrl);
    resultUrl.searchParams.set("token", payload.token);
    resultUrl.searchParams.set("status", payload.status.toLowerCase());
    
    // Add order ID if present
    const orderId = payload.merchantOrderId ?? "";
    if (orderId) {
      resultUrl.searchParams.set("order", orderId);
    }
    
    return NextResponse.redirect(resultUrl.toString());
  }

  return NextResponse.json({ received: true });
}
