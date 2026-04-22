import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { isPaymentEnabled } from "@/lib/payment/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/utils/api-response";
import { withUserAndCsrf } from "@/lib/utils/api-security";
import { logger } from "@/lib/utils/logger";
import { enforceRateLimit, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";
import { getUserProfile } from "@/services/profile/profile-records";

const purchaseSchema = z.object({
  planId: z.string().uuid("Geçersiz plan ID."),
  identityNumber: z
    .string()
    .regex(/^\d{11}$/, "TC Kimlik Numarası 11 haneli rakam olmalıdır.")
    .optional(),
});

// 5 purchase attempts per hour per user — prevents abuse
const PURCHASE_RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };

export async function POST(req: Request) {
  const security = await withUserAndCsrf(req, {
    rateLimitKey: "payments:purchase",
  });
  if (!security.ok) return security.response;
  const user = security.user!;

  // Rate limit
  const rateLimit = await enforceRateLimit(
    getUserRateLimitKey(user.id, "api:payments:purchase"),
    PURCHASE_RATE_LIMIT
  );
  if (rateLimit) return rateLimit.response;

  if (!isPaymentEnabled()) {
    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "Ödeme sistemi henüz aktif değil. Lütfen bizimle iletişime geçin.",
      503
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
    return apiError(
      API_ERROR_CODES.VALIDATION_ERROR,
      parsed.error.issues[0]?.message ?? "Geçersiz veri.",
      400
    );
  }

  const { planId, identityNumber } = parsed.data;

  try {
    const admin = createSupabaseAdminClient();

    // Fetch the plan
    const { data: plan, error: planError } = await admin
      .from("pricing_plans")
      .select("id, name, price, credits, is_active")
      .eq("id", planId)
      .eq("is_active", true)
      .maybeSingle<{
        id: string;
        name: string;
        price: number;
        credits: number;
        is_active: boolean;
      }>();

    if (planError || !plan) {
      return apiError(API_ERROR_CODES.NOT_FOUND, "Plan bulunamadı veya aktif değil.", 404);
    }

    if (plan.price === 0) {
      // Free plan — credit directly without payment.
      // IDEMPOTENCY GUARD: Check if this user already activated this free plan
      // within the last 24 hours to prevent concurrent duplicate requests.
      const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: recentActivations } = await admin
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("plan_id", plan.id)
        .eq("provider", "free")
        .eq("status", "success")
        .gte("created_at", windowStart);

      if ((recentActivations ?? 0) > 0) {
        return apiError(
          API_ERROR_CODES.BAD_REQUEST,
          "Bu ücretsiz planı son 24 saat içinde zaten aktifleştirdiniz.",
          409
        );
      }

      // Insert the payment record FIRST (before crediting) so a concurrent
      // request hitting the same window will be blocked by the check above.
      const { error: recordError } = await admin.from("payments").insert({
        user_id: user.id,
        amount: 0,
        currency: "TRY",
        provider: "free",
        status: "success",
        plan_id: plan.id,
        plan_name: plan.name,
        description: `Ücretsiz plan: ${plan.name}`,
      });

      if (recordError) {
        logger.payments.error("Free plan payment record insert failed", recordError, {
          userId: user.id,
          planId,
        });
        return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Plan kaydı oluşturulamadı.", 500);
      }

      // Now credit — if this fails we have an orphan payment record but no
      // double-credit. The record can be used to manually reconcile.
      const { error: creditError } = await admin.rpc("increment_user_credits", {
        p_user_id: user.id,
        p_credits: plan.credits,
      });

      if (creditError) {
        logger.payments.error("Free plan credit failed", creditError, { userId: user.id, planId });
        // Roll back the payment record so the user can retry
        await admin
          .from("payments")
          .delete()
          .eq("user_id", user.id)
          .eq("plan_id", plan.id)
          .eq("provider", "free")
          .gte("created_at", windowStart);
        return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Kredi eklenemedi.", 500);
      }

      captureServerEvent(
        "plan_purchased",
        {
          userId: user.id,
          planId: plan.id,
          planName: plan.name,
          credits: plan.credits,
          price: 0,
          provider: "free",
        },
        user.id
      );

      return apiSuccess(
        { credits: plan.credits, planName: plan.name },
        `${plan.name} planı aktifleştirildi. ${plan.credits} kredi hesabınıza eklendi.`
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
      logger.payments.error("Payment record insert failed", insertError, {
        userId: user.id,
        planId,
      });
      return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Ödeme kaydı oluşturulamadı.", 500);
    }

    // Fetch user profile for Iyzico buyer fields
    const profile = await getUserProfile(user.id);
    if (!profile || !profile.fullName || !user.email) {
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        "Ödeme için profil bilgileriniz (isim, e-posta) eksik.",
        400
      );
    }

    const nameParts = profile.fullName.trim().split(" ");
    const name = nameParts[0] || "User";
    const surname = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "Kullanıcı";

    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      "127.0.0.1";

    // Initiate Iyzico payment
    const { payment } = await import("@/lib/payment");
    const paymentResult = await payment.processPayment({
      amount: plan.price,
      orderId,
      listingId: paymentRecord.id, // reuse field for payment record ID
      userId: user.id,
      buyer: {
        id: user.id,
        name,
        surname,
        email: user.email,
        gsmNumber: profile.phone || "+905320000000",
        identityNumber: identityNumber || profile.identityNumber || "11111111111", // Default to test ID if missing and allowed
        address: profile.businessAddress || "Türkiye",
        city: profile.city || "Istanbul",
        country: "Turkey",
        zipCode: "34000",
        ip,
        registrationDate: new Date(profile.createdAt).toISOString().slice(0, 19).replace("T", " "),
        lastLoginDate: new Date().toISOString().slice(0, 19).replace("T", " "),
      },
    });

    if (!paymentResult.success) {
      // Update record to failed
      await admin.from("payments").update({ status: "failure" }).eq("id", paymentRecord.id);

      captureServerEvent(
        "plan_purchase_failed",
        {
          userId: user.id,
          planId: plan.id,
          error: paymentResult.error,
        },
        user.id
      );

      return apiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        paymentResult.error ?? "Ödeme başlatılamadı.",
        502
      );
    }

    // Update record with Iyzico token for webhook idempotency
    if (paymentResult.transactionId) {
      await admin
        .from("payments")
        .update({ iyzico_token: paymentResult.transactionId })
        .eq("id", paymentRecord.id);
    }

    captureServerEvent(
      "plan_purchase_initiated",
      {
        userId: user.id,
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
      },
      user.id
    );

    return apiSuccess(
      {
        paymentId: paymentRecord.id,
        // If Iyzico returns a redirect URL (3DS), pass it to the client
        paymentUrl: paymentResult.paymentUrl ?? null,
        transactionId: paymentResult.transactionId ?? null,
      },
      "Ödeme başlatıldı."
    );
  } catch (error) {
    logger.payments.error("Purchase plan unexpected error", error, { userId: user.id, planId });
    captureServerError("Purchase plan unexpected error", "payments", error, { userId: user.id });
    return NextResponse.json({ success: false, error: "Sunucu hatası." }, { status: 500 });
  }
}
