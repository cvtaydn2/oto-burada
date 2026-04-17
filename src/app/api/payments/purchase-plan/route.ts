import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { logger } from "@/lib/utils/logger";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { isPaymentEnabled } from "@/lib/payment/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/utils/api-response";
import { isValidRequestOrigin } from "@/lib/security";
import { enforceRateLimit, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";
import { z } from "zod";

const purchaseSchema = z.object({
  planId: z.string().uuid("Geçersiz plan ID."),
});

// 5 purchase attempts per hour per user — prevents abuse
const PURCHASE_RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };

export async function POST(req: Request) {
  // CSRF check
  if (!isValidRequestOrigin(req)) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz istek kaynağı.", 403);
  }

  const user = await getCurrentUser();
  if (!user) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Yetkisiz erişim.", 401);
  }

  // Rate limit
  const rateLimit = await enforceRateLimit(
    getUserRateLimitKey(user.id, "api:payments:purchase"),
    PURCHASE_RATE_LIMIT,
  );
  if (rateLimit) return rateLimit.response;

  if (!isPaymentEnabled()) {
    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "Ödeme sistemi henüz aktif değil. Lütfen bizimle iletişime geçin.",
      503,
    );
  }

  if (!hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "İstek gövdesi okunamadı.", 400);
  }

  const parsed = purchaseSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, parsed.error.issues[0]?.message ?? "Geçersiz veri.", 400);
  }

  const { planId } = parsed.data;

  try {
    const admin = createSupabaseAdminClient();

    // Fetch the plan
    const { data: plan, error: planError } = await admin
      .from("pricing_plans")
      .select("id, name, price, credits, is_active")
      .eq("id", planId)
      .eq("is_active", true)
      .maybeSingle<{ id: string; name: string; price: number; credits: number; is_active: boolean }>();

    if (planError || !plan) {
      return apiError(API_ERROR_CODES.NOT_FOUND, "Plan bulunamadı veya aktif değil.", 404);
    }

    if (plan.price === 0) {
      // Free plan — credit directly without payment
      const { error: creditError } = await admin.rpc("increment_user_credits", {
        p_user_id: user.id,
        p_credits: plan.credits,
      });

      if (creditError) {
        logger.payments.error("Free plan credit failed", creditError, { userId: user.id, planId });
        return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Kredi eklenemedi.", 500);
      }

      // Record the free plan activation
      await admin.from("payments").insert({
        user_id: user.id,
        amount: 0,
        currency: "TRY",
        provider: "free",
        status: "success",
        plan_id: plan.id,
        plan_name: plan.name,
        description: `Ücretsiz plan: ${plan.name}`,
      });

      captureServerEvent("plan_purchased", {
        userId: user.id,
        planId: plan.id,
        planName: plan.name,
        credits: plan.credits,
        price: 0,
        provider: "free",
      }, user.id);

      return apiSuccess(
        { credits: plan.credits, planName: plan.name },
        `${plan.name} planı aktifleştirildi. ${plan.credits} kredi hesabınıza eklendi.`,
      );
    }

    // Paid plan — create a pending payment record, then initiate Iyzico
    const orderId = `PLAN-${plan.id.slice(0, 8)}-${user.id.slice(0, 8)}-${Date.now()}`;

    const { data: paymentRecord, error: insertError } = await admin
      .from("payments")
      .insert({
        user_id: user.id,
        amount: plan.price,
        currency: "TRY",
        provider: "iyzico",
        status: "pending",
        plan_id: plan.id,
        plan_name: plan.name,
        description: `Plan satın alma: ${plan.name}`,
        metadata: {
          type: "plan_purchase",
          planId: plan.id,
          planName: plan.name,
          credits: plan.credits,
          orderId,
        },
      })
      .select("id")
      .single<{ id: string }>();

    if (insertError || !paymentRecord) {
      logger.payments.error("Payment record insert failed", insertError, { userId: user.id, planId });
      return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Ödeme kaydı oluşturulamadı.", 500);
    }

    // Initiate Iyzico payment
    const { payment } = await import("@/lib/payment");
    const paymentResult = await payment.processPayment({
      amount: plan.price,
      orderId,
      listingId: paymentRecord.id, // reuse field for payment record ID
      userId: user.id,
    });

    if (!paymentResult.success) {
      // Update record to failed
      await admin
        .from("payments")
        .update({ status: "failure" })
        .eq("id", paymentRecord.id);

      captureServerEvent("plan_purchase_failed", {
        userId: user.id,
        planId: plan.id,
        error: paymentResult.error,
      }, user.id);

      return apiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        paymentResult.error ?? "Ödeme başlatılamadı.",
        502,
      );
    }

    // Update record with Iyzico token for webhook idempotency
    if (paymentResult.transactionId) {
      await admin
        .from("payments")
        .update({ iyzico_token: paymentResult.transactionId })
        .eq("id", paymentRecord.id);
    }

    captureServerEvent("plan_purchase_initiated", {
      userId: user.id,
      planId: plan.id,
      planName: plan.name,
      amount: plan.price,
    }, user.id);

    return apiSuccess(
      {
        paymentId: paymentRecord.id,
        // If Iyzico returns a redirect URL (3DS), pass it to the client
        paymentUrl: paymentResult.paymentUrl ?? null,
        transactionId: paymentResult.transactionId ?? null,
      },
      "Ödeme başlatıldı.",
    );

  } catch (error) {
    logger.payments.error("Purchase plan unexpected error", error, { userId: user.id, planId });
    captureServerError("Purchase plan unexpected error", "payments", error, { userId: user.id });
    return NextResponse.json({ success: false, error: "Sunucu hatası." }, { status: 500 });
  }
}
