/* eslint-disable @typescript-eslint/no-explicit-any */

import { logger } from "@/lib/logging/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
}) {
  const iyzico = getIyzicoClient();
  const admin = createSupabaseAdminClient();

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
    const { data } = await admin
      .from("profiles")
      .select("identity_number")
      .eq("id", params.userId)
      .single();
    profile = data;
  } catch (err) {
    logger.db.error("Failed to fetch user profile for identity check", {
      userId: params.userId,
      error: err,
    });
    throw new Error("Kullanıcı profil bilgisi doğrulanamadı.");
  }

  // KVKK Compliance: Identity number is required for Iyzico
  // ── CRITICAL FIX: Issue Kritik-03 - Identity Number Validation ───
  // Always require real identity number, even in development
  // Test users should have valid test identity numbers in their profiles
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
  // ── BUSINESS LOGIC FIX: Issue PAYMENT-IDEM-01 - Pending Payment Deduplication ──
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  await admin
    .from("payments")
    .update({ status: "cancelled", metadata: { reason: "superseded_by_new_payment" } })
    .eq("user_id", params.userId)
    .eq("listing_id", params.listingId)
    .eq("package_id", params.basketItems[0]?.id)
    .eq("status", "pending")
    .gte("created_at", oneHourAgo);

  // 2. Create a new pending payment record in DB
  // package_id stores the slug (e.g. "acil_acil") so callback can look it up
  const { data: payment, error: dbError } = await admin
    .from("payments")
    .insert({
      user_id: params.userId,
      amount: params.price,
      currency: "TRY",
      provider: "iyzico",
      status: "pending",
      listing_id: params.listingId,
      plan_id: params.planId,
      package_id: params.basketItems[0]?.id, // slug — matched to doping_packages.slug
      description: params.basketItems.map((i) => i.name).join(", "),
      metadata: {
        basketItems: params.basketItems,
      },
    })
    .select(
      "id, user_id, amount, currency, provider, status, listing_id, plan_id, package_id, description, metadata, iyzico_token, iyzico_payment_id, processed_at, webhook_processed_at, created_at, updated_at"
    )
    .single();

  if (dbError) throw new Error(`Database error: ${dbError.message}`);

  const [name, ...surnameParts] = params.fullName.split(" ");
  const surname = surnameParts.join(" ") || "Soyisim";

  // 3. Prepare Iyzico request
  const request = {
    locale: "tr",
    conversationId: payment.id,
    price: params.price.toString(),
    paidPrice: params.price.toString(),
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
      identityNumber: identityNumber, // KVKK compliant - from user profile
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
      price: item.price.toString(),
    })),
  };

  // 4. Call Iyzico with timeout (F-05)
  try {
    return await withTimeout(
      new Promise<{ paymentPageUrl: string; token: string }>((resolve, reject) => {
        iyzico.checkoutFormInitialize.create(request, async (err: any, result: any) => {
          if (err || result.status !== "success") {
            // Update payment record as failed
            await admin
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
          await admin.from("payments").update({ iyzico_token: result.token }).eq("id", payment.id);

          resolve({
            paymentPageUrl: result.paymentPageUrl,
            token: result.token,
          });
        });
      }),
      15_000 // 15s timeout
    );
  } catch (error) {
    await admin
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
  const admin = createSupabaseAdminClient();

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
            // Safe to call multiple times (idempotent)
            await admin.rpc("confirm_payment_success", {
              p_iyzico_token: token,
              p_user_id: userId,
              p_iyzico_payment_id: result.paymentId,
            });
          } else {
            // Failed/cancelled — mark as failure atomically
            await admin
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
