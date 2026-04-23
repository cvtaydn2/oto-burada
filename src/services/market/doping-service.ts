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
  created_at: string;
  fulfilled_at: string | null;
  id: string;
  iyzico_token: string | null;
  status: string;
};

const pendingInits = new Map<string, Promise<DopingResult>>();

/**
 * Applies premium doping effects to a listing.
 */
export async function applyDopingToListing(
  listingId: string,
  userId: string,
  dopingTypes: DopingType[],
  buyer?: BuyerInfo
): Promise<DopingResult> {
  const idempotencyKey = `doping-init:${userId}:${listingId}:${[...dopingTypes].sort().join(",")}`;

  // Fix 8: Reuse pending initialization promise if the same request is in-flight
  const existingPending = pendingInits.get(idempotencyKey);
  if (existingPending) return existingPending;

  const initPromise = (async (): Promise<DopingResult> => {
    try {
      if (!hasSupabaseAdminEnv()) return { success: false, message: "Server connection failed" };
      if (!isPaymentEnabled()) {
        return {
          success: false,
          message: "Doping ödemeleri henüz aktif değil. Lütfen bizimle iletişime geçin.",
        };
      }

      const admin = createSupabaseAdminClient();
      const listingResult = await admin
        .from("listings")
        .select("id, seller_id, status")
        .eq("id", listingId)
        .single();

      if (listingResult.error || !listingResult.data) {
        return { success: false, message: "Doping uygulanabilir ilan bulunamadı." };
      }

      const listing = listingResult.data;
      if (listing.seller_id !== userId || listing.status === "archived") {
        return { success: false, message: "Doping uygulanabilir ilan bulunamadı." };
      }

      // 1. Calculate Total
      const totalAmount = dopingTypes.reduce((sum, type) => sum + DOPING_PRICES[type].price, 0);
      const durationDays = dopingTypes.includes("highlighted") ? 15 : 7;
      const metadata = {
        type: "doping",
        listingId,
        dopingTypes,
        durationDays,
      };

      const paymentLookup = await admin
        .from("payments")
        .select("id, iyzico_token, status, fulfilled_at, created_at, metadata")
        .eq("user_id", userId)
        .eq("listing_id", listingId)
        .eq("provider", "iyzico")
        .eq("idempotency_key", idempotencyKey)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<ExistingPaymentState & { metadata: Record<string, unknown> }>();

      if (paymentLookup.error) {
        return { success: false, message: "Bekleyen ödeme kontrol edilemedi." };
      }

      const existingPayment = paymentLookup.data;

      // Fix 1 & 2: Deterministic reuse and reason codes
      if (existingPayment?.status === "success" || existingPayment?.fulfilled_at) {
        return {
          success: false,
          message: "Bu doping için ödeme zaten tamamlanmış. Lütfen ilan durumunu kontrol edin.",
          transactionId: existingPayment.iyzico_token ?? undefined,
        };
      }

      // Fix 10: Stale payment expiry policy (30 mins)
      const STALE_PENDING_MS = 30 * 60 * 1000;
      const isStale =
        existingPayment?.status === "pending" &&
        Date.now() - new Date(existingPayment.created_at).getTime() > STALE_PENDING_MS;

      if (isStale) {
        await admin
          .from("payments")
          .update({
            status: "failure",
            metadata: {
              ...existingPayment.metadata,
              status_reason: "expired",
              expired_at: new Date().toISOString(),
            },
          })
          .eq("id", existingPayment.id);
        // Fall through to create fresh payment
      } else if (existingPayment?.status === "pending" && existingPayment.iyzico_token) {
        return {
          success: true,
          message: "Mevcut ödeme işleminiz devam ediyor.",
          transactionId: existingPayment.iyzico_token,
        };
      }

      let paymentRecord: { id: string } | null = null;
      if (existingPayment?.status === "pending" && !isStale) {
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
            metadata: { ...metadata, status_reason: "init" },
          })
          .select("id")
          .single<{ id: string }>();

        if (insertResult.error || !insertResult.data) {
          return { success: false, message: "Ödeme kaydı oluşturulamadı." };
        }
        paymentRecord = insertResult.data;
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
        await admin
          .from("payments")
          .update({
            status: "failure",
            metadata: { ...metadata, status_reason: "payment_failed", error: paymentResult.error },
          })
          .eq("id", paymentRecord.id);
        return { success: false, message: paymentResult.error || "Ödeme işlemi başarısız oldu." };
      }

      if (paymentResult.transactionId) {
        await admin
          .from("payments")
          .update({ iyzico_token: paymentResult.transactionId })
          .eq("id", paymentRecord.id);
      }

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
            status_reason: "processed",
          },
        })
        .eq("id", paymentRecord.id);

      return await finalizeDoping(
        admin,
        listingId,
        userId,
        dopingTypes,
        durationDays,
        paymentRecord.id
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Beklenmedik bir hata oluştu.";
      return { success: false, message: `İşlem başarısız: ${errorMessage}` };
    } finally {
      pendingInits.delete(idempotencyKey);
    }
  })();

  pendingInits.set(idempotencyKey, initPromise);
  return initPromise;
}

async function finalizeDoping(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  listingId: string,
  userId: string,
  dopingTypes: DopingType[],
  durationDays: number,
  paymentId: string
): Promise<DopingResult> {
  const { data: dopingResult, error: dopingError } = await admin.rpc("apply_listing_doping", {
    p_listing_id: listingId,
    p_user_id: userId,
    p_doping_types: dopingTypes,
    p_duration_days: durationDays,
    p_payment_id: paymentId,
  });

  if (dopingError) {
    await admin
      .from("payments")
      .update({
        status: "failure",
        metadata: { status_reason: "apply_failed", error: dopingError.message },
      })
      .eq("id", paymentId);
    return { success: false, message: "Doping uygulanırken bir hata oluştu." };
  }

  if (dopingResult?.applied_count === 0) {
    await admin
      .from("payments")
      .update({
        status: "cancelled",
        metadata: { status_reason: "already_active" },
      })
      .eq("id", paymentId);
    return {
      success: false,
      message: "Bu doping zaten aktif. Lütfen süre dolmadan tekrar denemeyin.",
    };
  }

  await admin
    .from("payments")
    .update({
      fulfilled_at: new Date().toISOString(),
      metadata: { status_reason: "fulfilled" },
    })
    .eq("id", paymentId);

  return { success: true, message: "Dopingler başarıyla uygulandı!" };
}
