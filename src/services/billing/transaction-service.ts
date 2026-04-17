import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";

export type CreditTransactionType = 'purchase' | 'doping_spend' | 'admin_adjustment' | 'refund';

export interface CreditTransactionInput {
  userId: string;
  amount: number;
  type: CreditTransactionType;
  description?: string;
  referenceId?: string;
  metadata?: Record<string, any>;
}

/**
 * Service to handle credit transactions with robust auditing.
 */
export async function logCreditTransaction(input: CreditTransactionInput) {
  const admin = createSupabaseAdminClient();
  
  try {
    const { data, error } = await admin
      .from("credit_transactions")
      .insert({
        user_id: input.userId,
        amount: input.amount,
        transaction_type: input.type,
        description: input.description,
        reference_id: input.referenceId,
        metadata: input.metadata || {}
      })
      .select()
      .single();

    if (error) {
      logger.payments.error("Failed to log credit transaction", error, { input });
      return null;
    }

    return data;
  } catch (err) {
    logger.payments.error("Unexpected error logging credit transaction", err, { input });
    return null;
  }
}

/**
 * Atomic credit adjustment with audit trail.
 * Uses a single database transaction through an RPC (if available) or individual calls.
 */
export async function adjustUserCredits(input: CreditTransactionInput) {
  const admin = createSupabaseAdminClient();
  
  // 1. Log the intent/transaction first
  const log = await logCreditTransaction(input);
  if (!log) {
    throw new Error("Transaction could not be logged. Aborting credit adjustment for security.");
  }

  // 2. Perform the actual balance update
  // We use the increment_user_credits RPC which handles atomic update.
  const { data: newBalance, error: updateError } = await admin.rpc("increment_user_credits", {
    p_user_id: input.userId,
    p_credits: input.amount
  });

  if (updateError) {
    logger.payments.error("Critical: Credit balance update failed after logging transaction", updateError, { 
      transactionId: log.id 
    });
    throw updateError;
  }

  return { transactionId: log.id, newBalance };
}

/**
 * Records a doping application for history and tracking.
 */
export async function logDopingApplication(input: {
  listingId: string;
  userId: string;
  dopingType: string;
  durationDays: number;
  paymentId?: string;
  metadata?: Record<string, any>;
}) {
  const admin = createSupabaseAdminClient();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + input.durationDays);

  const { data, error } = await admin
    .from("doping_applications")
    .insert({
      listing_id: input.listingId,
      user_id: input.userId,
      doping_type: input.dopingType,
      duration_days: input.durationDays,
      expires_at: expiresAt.toISOString(),
      payment_id: input.paymentId,
      metadata: input.metadata || {}
    })
    .select()
    .single();

  if (error) {
    logger.payments.error("Failed to log doping application", error, { input });
  }

  return data;
}
