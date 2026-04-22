import { payment } from "@/lib/payment";
import { isPaymentEnabled } from "@/lib/payment/config";
import { DOPING_PRICES, DopingId } from "@/lib/payment/constants";
import { BuyerInfo } from "@/lib/payment/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

export type DopingType = DopingId;

export interface DopingResult {
  success: boolean;
  message: string;
  paymentUrl?: string;
  transactionId?: string;
}

type ExistingPaymentState = {
  fulfilled_at: string | null;
  id: string;
  iyzico_token: string | null;
  status: string;
};

/**
 * Applies premium doping effects to a listing.
 *
 * SECURITY: This function now delegates to a secure database function
 * that enforces ownership checks and prevents race conditions.
 *
 * Payment processing is separated from doping application:
 * 1. Payment is processed first (via webhook or direct)
 * 2. Doping is applied only after payment confirmation
 * 3. Each step is idempotent and atomic
 */
export async function applyDopingToListing(
  listingId: string,
  userId: string,
  dopingTypes: DopingType[],
  buyer?: BuyerInfo
): Promise<DopingResult> {
  if (!hasSupabaseAdminEnv()) return { success: false, message: "Server connection failed" };
  if (!isPaymentEnabled()) {
    return {
      success: false,
      message: "Doping ödemeleri henüz aktif değil. Lütfen bizimle iletişime geçin.",
    };
  }

  const admin = createSupabaseAdminClient();
  const { data: listing, error: listingError } = await admin
    .from("listings")
    .select("id, seller_id, status")
    .eq("id", listingId)
    .single<{ id: string; seller_id: string; status: string }>();

  if (listingError || !listing || listing.seller_id !== userId || listing.status === "archived") {
    return { success: false, message: "Doping uygulanabilir ilan bulunamadı." };
  }

  // 1. Calculate Total
  const totalAmount = dopingTypes.reduce((sum, type) => sum + DOPING_PRICES[type].price, 0);
  const durationDays = dopingTypes.includes("highlighted") ? 15 : 7;
  const idempotencyKey = `doping-init:${userId}:${listingId}:${[...dopingTypes].sort().join(",")}`;
  const metadata = {
    type: "doping",
    listingId,
    dopingTypes,
    durationDays,
  };

  const { data: existingPayment, error: existingPaymentError } = await admin
    .from("payments")
    .select("id, iyzico_token, status, fulfilled_at")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .eq("provider", "iyzico")
    .eq("idempotency_key", idempotencyKey)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ExistingPaymentState>();

  if (existingPaymentError) {
    return { success: false, message: "Bekleyen ödeme kontrol edilemedi." };
  }

  if (existingPayment?.status === "success" || existingPayment?.fulfilled_at) {
    return {
      success: false,
      message: "Bu doping için ödeme zaten tamamlanmış. Lütfen ilan durumunu kontrol edin.",
      transactionId: existingPayment.iyzico_token ?? undefined,
    };
  }

  if (existingPayment?.status === "pending" && existingPayment.iyzico_token) {
    return {
      success: false,
      message: "Bu ilan için bekleyen bir doping ödemeniz var. Lütfen mevcut ödemeyi tamamlayın.",
      transactionId: existingPayment.iyzico_token ?? undefined,
    };
  }

  let paymentRecord: { id: string } | null = null;
  let paymentInsertError: { code?: string; message?: string } | null = null;

  if (existingPayment?.status === "pending") {
    paymentRecord = { id: existingPayment.id };
  } else {
    const insertResult = await admin
      .from("payments")
      .insert({
        user_id: userId,
        listing_id: listingId,
        amount: totalAmount,
        provider: "iyzico",
        status: "pending",
        idempotency_key: idempotencyKey,
        metadata,
      })
      .select("id")
      .single<{ id: string }>();

    paymentRecord = insertResult.data;
    paymentInsertError = insertResult.error;
  }

  if (paymentInsertError || !paymentRecord) {
    if (paymentInsertError?.code === "23505") {
      const { data: existingPending, error: pendingLookupError } = await admin
        .from("payments")
        .select("id, iyzico_token")
        .eq("user_id", userId)
        .eq("listing_id", listingId)
        .eq("provider", "iyzico")
        .eq("status", "pending")
        .eq("idempotency_key", idempotencyKey)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ id: string; iyzico_token: string | null }>();

      if (pendingLookupError) {
        return { success: false, message: "Bekleyen ödeme kontrol edilemedi." };
      }

      if (existingPending) {
        return {
          success: false,
          message:
            "Bu ilan için bekleyen bir doping ödemeniz var. Lütfen mevcut ödemeyi tamamlayın.",
          transactionId: existingPending.iyzico_token ?? undefined,
        };
      }
    }

    return { success: false, message: "Ödeme kaydı oluşturulamadı." };
  }

  // 2. Process Payment
  const paymentResult = await payment.processPayment({
    amount: totalAmount,
    orderId: `DOP-${paymentRecord.id}`,
    listingId,
    userId,
    conversationId: paymentRecord.id,
    buyer,
  });

  if (!paymentResult.success) {
    await admin.from("payments").update({ status: "failure" }).eq("id", paymentRecord.id);
    return { success: false, message: paymentResult.error || "Ödeme işlemi başarısız oldu." };
  }

  if (paymentResult.transactionId) {
    const { error: tokenUpdateError } = await admin
      .from("payments")
      .update({ iyzico_token: paymentResult.transactionId })
      .eq("id", paymentRecord.id);

    if (tokenUpdateError) {
      await admin.from("payments").update({ status: "failure" }).eq("id", paymentRecord.id);
      return { success: false, message: "Ödeme kaydı doğrulanamadı." };
    }
  }

  // If 3DS is required (paymentUrl provided), return it for redirect
  if (paymentResult.paymentUrl) {
    return {
      success: true,
      message: "Ödeme sayfasına yönlendiriliyorsunuz...",
      paymentUrl: paymentResult.paymentUrl,
      transactionId: paymentResult.transactionId,
    };
  }

  await admin
    .from("payments")
    .update({
      status: "success",
      processed_at: new Date().toISOString(),
      metadata: {
        ...metadata,
        transaction_id: paymentResult.transactionId ?? null,
      },
    })
    .eq("id", paymentRecord.id);

  // 3. Apply doping using secure database function
  // This function enforces ownership and prevents race conditions
  const { data: dopingResult, error: dopingError } = await admin.rpc("apply_listing_doping", {
    p_listing_id: listingId,
    p_user_id: userId,
    p_doping_types: dopingTypes,
    p_duration_days: durationDays,
    p_payment_id: paymentRecord.id,
  });

  if (dopingError) {
    await admin.from("payments").update({ status: "failure" }).eq("id", paymentRecord.id);
    return { success: false, message: "Doping uygulanırken bir hata oluştu." };
  }

  // Check if any dopings were actually applied
  if (dopingResult?.applied_count === 0) {
    await admin.from("payments").update({ status: "cancelled" }).eq("id", paymentRecord.id);
    return {
      success: false,
      message: "Bu doping zaten aktif. Lütfen süre dolmadan tekrar denemeyin.",
    };
  }

  // 5. Mark payment as fulfilled
  await admin
    .from("payments")
    .update({ fulfilled_at: new Date().toISOString() })
    .eq("id", paymentRecord.id);

  return { success: true, message: "Dopingler başarıyla uygulandı!" };
}
