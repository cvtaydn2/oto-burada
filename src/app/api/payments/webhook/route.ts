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
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { createDatabaseNotification } from "@/services/notifications/notification-records";

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

/**
 * Parse the metadata stored on the payment record to determine
 * what action to take after a successful payment.
 */
interface PaymentMeta {
  type: "plan_purchase" | "doping";
  planId?: string;
  planName?: string;
  credits?: number;
  listingId?: string;
  dopingTypes?: string[];
  durationDays?: number;
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

  // Parse form-encoded body (Iyzico sends application/x-www-form-urlencoded)
  let payload: IyzicoWebhookPayload;
  try {
    const text = await request.text();
    const params = new URLSearchParams(text);
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

  if (!payload.token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  // Verify signature — fail-closed: missing header is treated as invalid
  const signature = request.headers.get("x-iyz-signature");
  if (!signature) {
    logger.payments.warn("Webhook rejected: missing x-iyz-signature header", {
      token: payload.token,
      merchantOrderId: payload.merchantOrderId,
    });
    captureServerEvent("payment_webhook_signature_missing", { token: payload.token });
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }
  if (!verifyIyzicoSignature(payload.token, signature, secretKey)) {
    logger.payments.warn("Webhook rejected: signature mismatch", { token: payload.token });
    captureServerEvent("payment_webhook_signature_invalid", { token: payload.token });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const isSuccess = payload.status === "SUCCESS";

  // ── Idempotent Webhook Processing via Database Function ─────────────────
  // Use the secure database function that handles:
  // 1. Idempotency checks
  // 2. State machine validation
  // 3. Atomic payment processing
  // 4. Race condition prevention
  
  try {
    const { data: result, error: rpcError } = await admin.rpc("process_payment_webhook", {
      p_iyzico_token: payload.token,
      p_status: payload.status,
      p_iyzico_payment_id: payload.paymentId ?? null,
    });

    if (rpcError) {
      logger.payments.error("Webhook RPC failed", rpcError, { token: payload.token });
      captureServerError("Webhook RPC failed", "payments", rpcError, { token: payload.token });
      
      // Return 200 to prevent Iyzico retries (we logged the error)
      return NextResponse.json({ received: true, error: true });
    }

    // Check if this was an idempotent call
    if (result?.idempotent) {
      logger.payments.info("Webhook already processed (idempotent)", { token: payload.token });
      return NextResponse.json({ received: true, idempotent: true });
    }

    // Check if this was an orphan record
    if (result?.orphan) {
      logger.payments.warn("Webhook created orphan record", { token: payload.token });
      return NextResponse.json({ received: true, orphan: true });
    }

    // ── Post-payment actions (success only) ─────────────────────────────────
    // These are non-critical actions that happen AFTER payment is processed
    // If they fail, payment is still successful (already committed in DB)
    
    if (isSuccess && result?.success) {
      // Fetch payment metadata for fulfillment jobs
      const { data: payment } = await admin
        .from("payments")
        .select("user_id, metadata, listing_id, id")
        .eq("iyzico_token", payload.token)
        .single<{
          id: string;
          user_id: string;
          metadata: PaymentMeta | null;
          listing_id: string | null;
        }>();

      if (payment) {
        const meta = payment.metadata;
        const userId = payment.user_id;

        try {
          // Process fulfillment directly in webhook (no cron dependency)
          // Payment is already committed — these are best-effort post-payment actions.
          // Failures are logged but do NOT fail the webhook response.

          if (meta?.type === "plan_purchase") {
            // Credits are already added by process_payment_success() RPC.
            // Just send the notification directly.
            await createDatabaseNotification({
              userId,
              type: "system",
              title: "Paket satın alındı",
              message: `${meta.planName ?? "Paket"} başarıyla aktifleştirildi. ${meta.credits ?? 0} kredi hesabınıza eklendi.`,
              href: "/dashboard/pricing",
            });

            captureServerEvent("plan_purchased", {
              userId,
              planId: meta.planId,
              planName: meta.planName,
              credits: meta.credits,
            }, userId);

          } else if (meta?.type === "doping" && meta.listingId && meta.dopingTypes) {
            // Apply doping immediately — fast DB RPC, well within webhook timeout.
            const { error: dopingError } = await admin.rpc("apply_listing_doping", {
              p_listing_id: meta.listingId,
              p_user_id: userId,
              p_doping_types: meta.dopingTypes,
              p_duration_days: meta.durationDays ?? 7,
              p_payment_id: payment.id,
            });

            if (dopingError) {
              logger.payments.error("Doping application failed in webhook", dopingError, {
                userId,
                paymentId: payment.id,
                listingId: meta.listingId,
                token: payload.token,
              });
              captureServerError("Doping application failed in webhook", "payments", dopingError, {
                userId,
                paymentId: payment.id,
                listingId: meta.listingId,
              }, userId);
            } else {
              logger.payments.info("Doping applied immediately via webhook", {
                userId,
                listingId: meta.listingId,
                dopingTypes: meta.dopingTypes,
              });
            }

            // Send notification directly.
            await createDatabaseNotification({
              userId,
              type: "system",
              title: "Doping aktifleştirildi",
              message: `İlanınız ${meta.durationDays ?? 7} gün boyunca öne çıkarıldı.`,
              href: `/dashboard/listings`,
            });

            captureServerEvent("doping_payment_success", {
              userId,
              listingId: meta.listingId,
              dopingTypes: meta.dopingTypes,
              durationDays: meta.durationDays ?? 7,
            }, userId);
          }
        } catch (err) {
          // Post-payment actions failed — log but don't fail the webhook.
          // Payment is already committed in DB.
          logger.payments.error("Post-payment fulfillment failed", err, { userId, token: payload.token });
          captureServerError("Post-payment fulfillment failed", "payments", err, { userId, token: payload.token }, userId);
        }
      }
    }

    return NextResponse.json({ received: true, success: result?.success });

  } catch (err) {
    // Unexpected error in webhook processing
    logger.payments.error("Webhook processing unexpected error", err, { token: payload.token });
    captureServerError("Webhook processing unexpected error", "payments", err, { token: payload.token });
    
    // Return 200 to prevent Iyzico retries
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
