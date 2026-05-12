"use server";

/**
 * Payment Server Actions
 *
 * Modern server actions pattern for payment operations.
 * Replaces legacy PaymentService class-based pattern.
 *
 * Migration: Phase 28.5 - Legacy Service Patterns Migration
 */

import { getAuthContext } from "@/features/auth/lib/session";
import {
  initializePaymentCheckout,
  retrievePaymentResult,
} from "@/features/payments/services/payment-logic";
import { getClientIp } from "@/lib/api/ip";
import { DOPING_PACKAGES } from "@/lib/doping";
import { createSupabaseServerClient } from "@/lib/server";

/**
 * Initialize a payment checkout form with Iyzico
 *
 * @param params - Payment initialization parameters (excluding userId which is resolved server-side)
 * @returns Payment page URL and token
 */
export async function initializeCheckoutFormAction(params: {
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
  const { user } = await getAuthContext();

  if (!user) {
    throw new Error("Ödeme başlatmak için giriş yapmalısınız.");
  }

  return initializePaymentCheckout({
    ...params,
    userId: user.id,
  });
}

export async function initiateDopingCheckoutAction(params: {
  listingId: string;
  packageId: string;
}) {
  const { user } = await getAuthContext();

  if (!user) {
    throw new Error("Ödeme başlatmak için giriş yapmalısınız.");
  }

  const supabase = await createSupabaseServerClient();
  const pkg = DOPING_PACKAGES.find((item) => item.id === params.packageId);

  if (!pkg) {
    throw new Error("Geçersiz paket seçimi.");
  }

  const [{ data: profile }, { data: listing }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone, city, business_address")
      .eq("id", user.id)
      .single(),
    supabase.from("listings").select("seller_id, status").eq("id", params.listingId).single(),
  ]);

  if (!listing) {
    throw new Error("İlan bulunamadı.");
  }

  if (listing.seller_id !== user.id) {
    throw new Error("Bu ilan size ait değil.");
  }

  if (listing.status !== "approved") {
    throw new Error("Sadece onaylı ilanlara doping yapılabilir.");
  }

  if (!profile?.full_name?.trim()) {
    throw new Error("Lütfen profil bilgilerinizi tamamlayın (Ad Soyad gerekli).");
  }

  if (!profile?.phone?.trim()) {
    throw new Error("Lütfen profil bilgilerinizi tamamlayın (Telefon gerekli).");
  }

  const clientIp = await getClientIp();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const callbackUrl = `${baseUrl}/api/payments/callback`;
  const idempotencyKey = `pay_${user.id}_${params.listingId}_${params.packageId}_${Math.floor(Date.now() / 300000)}`;

  return initializePaymentCheckout({
    userId: user.id,
    email: user.email ?? "",
    fullName: profile.full_name,
    phone: profile.phone,
    address: profile.business_address || profile.city || "Türkiye",
    city: profile.city || "Istanbul",
    ip: clientIp,
    price: pkg.price,
    basketItems: [
      {
        id: pkg.id,
        name: pkg.name,
        category: "Doping",
        price: pkg.price,
      },
    ],
    callbackUrl,
    listingId: params.listingId,
    idempotencyKey,
  });
}

/**
 * Retrieve checkout result from Iyzico
 *
 * @param token - Iyzico checkout token
 * @returns Payment status and details
 */
export async function retrieveCheckoutResultAction(token: string) {
  const { user } = await getAuthContext();

  if (!user) {
    throw new Error("Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.");
  }

  return retrievePaymentResult(token, user.id);
}

/**
 * Get payment details by iyzico token securely on the server
 *
 * @param token - Iyzico checkout token
 * @returns Payment record details
 */
export async function getPaymentDetailsAction(token: string) {
  const { user } = await getAuthContext();

  if (!user) {
    throw new Error("Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.");
  }

  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("payments")
    .select("id, amount, status, plan_name, fulfilled_at")
    .eq("iyzico_token", token)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
