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

  // 1. Calculate Total
  const totalAmount = dopingTypes.reduce((sum, type) => sum + DOPING_PRICES[type].price, 0);

  // 2. Process Payment
  const paymentResult = await payment.processPayment({
    amount: totalAmount,
    orderId: `DOP-${listingId}-${Date.now()}`,
    listingId,
    userId,
    buyer,
  });

  if (!paymentResult.success) {
    return { success: false, message: paymentResult.error || "Ödeme işlemi başarısız oldu." };
  }

  // If 3DS is required (paymentUrl provided), return it for redirect
  if (paymentResult.paymentUrl) {
    // Create a pending payment record for tracking
    await admin
      .from("payments")
      .insert({
        user_id: userId,
        listing_id: listingId,
        amount: totalAmount,
        provider: "iyzico",
        status: "pending",
        iyzico_token: paymentResult.transactionId,
        idempotency_key: `doping-${listingId}-${paymentResult.transactionId}`,
        metadata: {
          type: "doping",
          listingId,
          dopingTypes,
          durationDays: dopingTypes.includes("highlighted") ? 15 : 7,
        },
      })
      .select("id")
      .single();

    return {
      success: true,
      message: "Ödeme sayfasına yönlendiriliyorsunuz...",
      paymentUrl: paymentResult.paymentUrl,
      transactionId: paymentResult.transactionId,
    };
  }

  // 3. Direct payment success (no 3DS) - create payment record first
  const { data: paymentRecord, error: paymentError } = await admin
    .from("payments")
    .insert({
      user_id: userId,
      listing_id: listingId,
      amount: totalAmount,
      provider: "iyzico",
      status: "success",
      iyzico_token: paymentResult.transactionId,
      idempotency_key: `doping-${listingId}-${paymentResult.transactionId}`,
      processed_at: new Date().toISOString(),
      metadata: {
        type: "doping",
        listingId,
        dopingTypes,
        durationDays: dopingTypes.includes("highlighted") ? 15 : 7,
        transaction_id: paymentResult.transactionId,
      },
    })
    .select("id")
    .single();

  if (paymentError || !paymentRecord) {
    return { success: false, message: "Ödeme kaydı oluşturulamadı." };
  }

  // 4. Apply doping using secure database function
  // This function enforces ownership and prevents race conditions
  const { data: dopingResult, error: dopingError } = await admin.rpc("apply_listing_doping", {
    p_listing_id: listingId,
    p_user_id: userId,
    p_doping_types: dopingTypes,
    p_duration_days: dopingTypes.includes("highlighted") ? 15 : 7,
    p_payment_id: paymentRecord.id,
  });

  if (dopingError) {
    return { success: false, message: "Doping uygulanırken bir hata oluştu." };
  }

  // Check if any dopings were actually applied
  if (dopingResult?.applied_count === 0) {
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
