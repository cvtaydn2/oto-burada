/* eslint-disable @typescript-eslint/no-explicit-any */

import { logger } from "@/lib/logging/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { getIyzicoClient } from "./iyzico-client";

/**
 * Initializes a checkout form with Iyzico
 *
 * Pure function - no class wrapper
 * Migration: Phase 28.5 - Legacy Service Patterns Migration
 */
export async function initializePaymentCheckout(params: {
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  ip: string;
  price: number;
  basketItems: { id: string; name: string; category: string; price: number }[];
  callbackUrl: string;
  listingId?: string;
  planId?: string;
  idempotencyKey?: string;
}) {
  const iyzico = getIyzicoClient();
  const supabase = await createSupabaseServerClient();

  // SECURITY: Validate required fields
  if (!params.fullName || params.fullName.trim() === "") {
    throw new Error("Ad Soyad bilgisi gereklidir");
  }

  if (!params.phone || params.phone.trim() === "") {
    throw new Error("Telefon numarası gereklidir");
  }

  // SECURITY: Get user's identity number from profile
  let profile;
  try {
    // USE SERVER CLIENT: Enforce RLS on profile access
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("identity_number")
      .eq("id", params.userId)
      .single();

    if (profileError) throw profileError;
    profile = data;
  } catch (err) {
    logger.db.error("Failed to fetch user profile for identity check", {
      userId: params.userId,
      error: err,
    });
    throw new Error("Kullanıcı profil bilgisi doğrulanamadı.");
  }

  // KVKK Compliance: Identity number is required for Iyzico
  if (!profile?.identity_number || profile.identity_number.length !== 11) {
    throw new Error(
      "Ödeme yapabilmek için TC Kimlik Numaranızı profil ayarlarınızdan eklemeniz gerekmektedir."
    );
  }

  // Validate identity number format (basic check)
  if (!/^\d{11}$/.test(profile.identity_number)) {
    throw new Error("Geçersiz TC Kimlik Numarası formatı. 11 haneli sayı olmalıdır.");
  }

  const identityNumber = profile.identity_number;

  // 1. SECURITY: Cancel any recent pending payments for same user+listing+package
  // This prevents duplicate pending records if user retries payment
  // USE SERVER CLIENT: Enforce RLS (now allowed by new UPDATE policy)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  await supabase
    .from("payments")
    .update({ status: "cancelled", metadata: { reason: "superseded_by_new_payment" } })
    .eq("user_id", params.userId)
    .eq("listing_id", params.listingId || "")
    .eq("package_id", params.basketItems[0]?.id || "")
    .eq("status", "pending")
    .gte("created_at", oneHourAgo);

  // 2. Create a new pending payment record in DB
  // USE SERVER CLIENT: Enforce RLS on payment creation (now allowed by new INSERT policy)
  const { data: payment, error: dbError } = await supabase
    .from("payments")
    .insert({
      user_id: params.userId,
      amount: params.price, // Stored as BIGINT (cents)
      currency: "TRY",
      provider: "iyzico",
      status: "pending",
      listing_id: params.listingId,
      plan_id: params.planId,
      package_id: params.basketItems[0]?.id,
      idempotency_key: params.idempotencyKey,
      description: params.basketItems.map((i) => i.name).join(", "),
      metadata: {
        basketItems: params.basketItems,
      },
    })
    .select()
    .single();

  if (dbError) {
    // Check for idempotency violation (P0001 or unique constraint)
    if (dbError.code === "23505") {
      // Find existing payment with this idempotency key
      const { data: existing } = await supabase
        .from("payments")
        .select("id, iyzico_token, status")
        .eq("idempotency_key", params.idempotencyKey!)
        .single();

      if (existing && existing.iyzico_token && existing.status === "pending") {
        return {
          paymentPageUrl: `REUSE_EXISTING`, // Frontend should handle this or we return the form
          token: existing.iyzico_token,
        };
      }
    }
    logger.db.error("Failed to create pending payment record", {
      error: dbError,
      userId: params.userId,
    });
    throw new Error(`Ödeme kaydı oluşturulamadı: ${dbError.message}`);
  }

  const [name, ...surnameParts] = params.fullName.split(" ");
  const surname = surnameParts.join(" ") || "Soyisim";

  // 3. Prepare Iyzico request
  // Iyzico expects Liras (e.g. "39.00")
  const request = {
    locale: "tr",
    conversationId: payment.id,
    price: (params.price / 100).toFixed(2),
    paidPrice: (params.price / 100).toFixed(2),
    currency: "TRY",
    basketId: payment.id,
    paymentGroup: "PRODUCT",
    callbackUrl: params.callbackUrl,
    enabledInstallments: [1],
    buyer: {
      id: params.userId,
      name: name || "İsim",
      surname: surname,
      gsmNumber: params.phone,
      email: params.email,
      identityNumber: identityNumber,
      lastLoginDate: new Date().toISOString().split(".")[0].replace("T", " "),
      registrationDate: new Date().toISOString().split(".")[0].replace("T", " "),
      registrationAddress: params.address,
      ip: params.ip,
      city: params.city,
      country: "Turkey",
      zipCode: "34000",
    },
    shippingAddress: {
      contactName: params.fullName,
      city: params.city,
      country: "Turkey",
      address: params.address,
      zipCode: "34000",
    },
    billingAddress: {
      contactName: params.fullName,
      city: params.city,
      country: "Turkey",
      address: params.address,
      zipCode: "34000",
    },
    basketItems: params.basketItems.map((item) => ({
      id: item.id,
      name: item.name,
      category1: item.category,
      itemType: "VIRTUAL",
      price: (item.price / 100).toFixed(2),
    })),
  };

  // 4. Call Iyzico with timeout
  try {
    return await withTimeout(
      new Promise<{ paymentPageUrl: string; token: string }>((resolve, reject) => {
        iyzico.checkoutFormInitialize.create(request, async (err: any, result: any) => {
          if (err || result.status !== "success") {
            // Update payment record as failed
            await supabase
              .from("payments")
              .update({
                status: "failure",
                metadata: { ...(payment.metadata ?? {}), error: err || result },
              })
              .eq("id", payment.id);

            reject(new Error(result?.errorMessage || "Iyzico initialization failed"));
            return;
          }

          // Update payment with token
          await supabase
            .from("payments")
            .update({ iyzico_token: result.token })
            .eq("id", payment.id);

          resolve({
            paymentPageUrl: result.paymentPageUrl,
            token: result.token,
          });
        });
      }),
      15_000
    );
  } catch (error) {
    await supabase
      .from("payments")
      .update({
        status: "failure",
        metadata: {
          ...(payment.metadata ?? {}),
          initialization_error: error instanceof Error ? error.message : String(error),
        },
        processed_at: new Date().toISOString(),
      })
      .eq("id", payment.id)
      .eq("status", "pending");

    throw error;
  }
}

/**
 * Retrieves checkout result from Iyzico and atomically updates payment status.
 * Uses confirm_payment_success RPC to prevent race conditions with webhook.
 *
 * Pure function - no class wrapper
 * Migration: Phase 28.5 - Legacy Service Patterns Migration
 *
 * @param token - Iyzico checkout token
 * @param userId - User ID for ownership verification (SECURITY: S-02)
 */
export async function retrievePaymentResult(token: string, userId: string) {
  const iyzico = getIyzicoClient();
  const supabase = await createSupabaseServerClient();

  return withTimeout(
    new Promise<{ status: string; paymentId: string; conversationId: string }>(
      (resolve, reject) => {
        iyzico.checkoutForm.retrieve({ locale: "tr", token }, async (err: any, result: any) => {
          if (err || result.status !== "success") {
            reject(new Error(result.errorMessage || "Iyzico retrieval failed"));
            return;
          }

          const iyzicoStatus = result.paymentStatus;

          if (iyzicoStatus === "SUCCESS") {
            // Atomic update: only transitions from 'pending' → 'success'
            // ── BUG FIX: Add proper error handling for RPC failure
            const { data: confirmResult, error: rpcError } = await supabase.rpc(
              "confirm_payment_success",
              {
                p_iyzico_token: token,
                p_user_id: userId,
                p_iyzico_payment_id: result.paymentId,
              }
            );

            if (rpcError || !confirmResult?.success) {
              logger.payments.error("Payment confirmation RPC failed", {
                rpcError,
                confirmResult,
                token,
                userId,
              });
              reject(
                new Error(
                  confirmResult?.error ||
                    "Ödeme onaylanamadı. Lütfen destek ekibiyle iletişime geçin."
                )
              );
              return;
            }
          } else {
            // Failed/cancelled — mark as failure atomically
            await supabase
              .from("payments")
              .update({
                status: "failure",
                iyzico_payment_id: result.paymentId,
                processed_at: new Date().toISOString(),
              })
              .eq("iyzico_token", token)
              .eq("user_id", userId)
              .eq("status", "pending"); // Only update if still pending
          }

          resolve({
            status: iyzicoStatus === "SUCCESS" ? "paid" : "failed",
            paymentId: result.paymentId,
            conversationId: result.conversationId,
          });
        });
      }
    ),
    15_000 // 15s timeout
  );
}

/**
 * Promise wrapper with timeout (F-05)
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Iyzico API timeout after ${ms}ms`)), ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}
