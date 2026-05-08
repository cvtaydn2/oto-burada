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
