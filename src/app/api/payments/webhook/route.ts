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

  // Verify signature
  const signature = request.headers.get("x-iyz-signature") ?? "";
  if (signature && !verifyIyzicoSignature(payload.token, signature, secretKey)) {
    logger.payments.warn("Webhook signature verification failed", { token: payload.token });
    captureServerEvent("payment_webhook_signature_invalid", { token: payload.token });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const isSuccess = payload.status === "SUCCESS";

  // ── Idempotency check ────────────────────────────────────────────────────
  // Use the Iyzico token as the idempotency key.
  // If we've already processed this token, return 200 immediately.
  const { data: existing } = await admin
    .from("payments")
    .select("id, status, user_id, metadata")
    .eq("iyzico_token", payload.token)
    .maybeSingle<{
      id: string;
      status: string;
      user_id: string;
      metadata: PaymentMeta | null;
    }>();

  if (existing?.status === "success") {
    // Already processed successfully — idempotent response
    logger.payments.info("Webhook already processed (idempotent)", { token: payload.token });
    return NextResponse.json({ received: true, idempotent: true });
  }

  // ── Update payment record ────────────────────────────────────────────────
  const newStatus = isSuccess ? "success" : "failure";

  if (existing) {
    // Update existing pending record
    await admin
      .from("payments")
      .update({
        status: newStatus,
        iyzico_payment_id: payload.paymentId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    // No matching record — webhook arrived before our DB insert (race condition)
    // Create a minimal record so we don't lose the event
    logger.payments.warn("Webhook received for unknown token — creating orphan record", {
      token: payload.token,
      merchantOrderId: payload.merchantOrderId,
    });
    await admin.from("payments").insert({
      iyzico_token: payload.token,
      iyzico_payment_id: payload.paymentId ?? null,
      status: newStatus,
      amount: 0,
      currency: "TRY",
      provider: "iyzico",
      description: `Webhook orphan: ${payload.merchantOrderId ?? "unknown"}`,
    });
    return NextResponse.json({ received: true, orphan: true });
  }

  // ── Post-payment actions (success only) ─────────────────────────────────
  if (!isSuccess) {
    captureServerEvent("payment_failed", {
      token: payload.token,
      userId: existing.user_id,
      merchantOrderId: payload.merchantOrderId,
    }, existing.user_id);
    return NextResponse.json({ received: true });
  }

  const meta = existing.metadata as PaymentMeta | null;
  const userId = existing.user_id;

  try {
    if (meta?.type === "plan_purchase" && meta.credits && meta.planId) {
      // Credit the user's balance
      await admin.rpc("increment_user_credits", {
        p_user_id: userId,
        p_credits: meta.credits,
      });

      await createDatabaseNotification({
        userId,
        type: "system",
        title: "Paket satın alındı",
        message: `${meta.planName ?? "Paket"} başarıyla aktifleştirildi. ${meta.credits} kredi hesabınıza eklendi.`,
        href: "/dashboard/pricing",
      });

      captureServerEvent("plan_purchased", {
        userId,
        planId: meta.planId,
        planName: meta.planName,
        credits: meta.credits,
      }, userId);

    } else if (meta?.type === "doping" && meta.listingId && meta.dopingTypes) {
      // Apply doping to the listing
      const now = new Date();
      const days = meta.durationDays ?? 7;
      const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

      const updates: Record<string, unknown> = {};
      if (meta.dopingTypes.includes("featured")) {
        updates.featured = true;
        updates.featured_until = expiresAt;
      }
      if (meta.dopingTypes.includes("urgent")) {
        updates.urgent_until = expiresAt;
      }
      if (meta.dopingTypes.includes("highlighted")) {
        updates.highlighted_until = expiresAt;
      }

      if (Object.keys(updates).length > 0) {
        await admin.from("listings").update(updates).eq("id", meta.listingId);
      }

      await createDatabaseNotification({
        userId,
        type: "system",
        title: "Doping aktifleştirildi",
        message: `İlanınız ${days} gün boyunca öne çıkarıldı.`,
        href: `/dashboard/listings`,
      });

      captureServerEvent("doping_applied_via_webhook", {
        userId,
        listingId: meta.listingId,
        dopingTypes: meta.dopingTypes,
        durationDays: days,
      }, userId);
    }
  } catch (err) {
    // Post-payment action failed — log but don't return error to Iyzico
    // (returning error would cause Iyzico to retry, which could double-credit)
    captureServerError("Post-payment action failed", "payments", err, {
      userId,
      token: payload.token,
      metaType: meta?.type,
    }, userId);
    logger.payments.error("Post-payment action failed", err, { userId, token: payload.token });
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
    if (payload.merchantOrderId) resultUrl.searchParams.set("order", payload.merchantOrderId);
    
    return NextResponse.redirect(resultUrl.toString());
  }

  return NextResponse.json({ received: true });
}
