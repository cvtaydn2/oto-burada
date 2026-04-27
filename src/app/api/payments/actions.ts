"use server";

/**
 * Payment Server Actions
 *
 * Modern server actions pattern for payment operations.
 * Replaces legacy PaymentService class-based pattern.
 *
 * Migration: Phase 28.5 - Legacy Service Patterns Migration
 */

import {
  initializePaymentCheckout,
  retrievePaymentResult,
} from "@/services/payments/payment-logic";

/**
 * Initialize a payment checkout form with Iyzico
 *
 * @param params - Payment initialization parameters
 * @returns Payment page URL and token
 */
export async function initializeCheckoutFormAction(params: {
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
  return initializePaymentCheckout(params);
}

/**
 * Retrieve checkout result from Iyzico
 *
 * @param token - Iyzico checkout token
 * @param userId - User ID for ownership verification
 * @returns Payment status and details
 */
export async function retrieveCheckoutResultAction(token: string, userId: string) {
  return retrievePaymentResult(token, userId);
}
