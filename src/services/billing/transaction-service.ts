import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";

export type CreditTransactionType = 'purchase' | 'doping_spend' | 'admin_adjustment' | 'refund';

export interface CreditTransactionInput {
  userId: string;
  amount: number;
  type: CreditTransactionType;
  description?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
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
 * Guaranteed consistent by using a single database transaction via RPC.
 */
export async function adjustUserCredits(input: CreditTransactionInput) {
  const admin = createSupabaseAdminClient();
  
  const { data, error } = await admin.rpc("adjust_user_credits_atomic", {
    p_user_id: input.userId,
    p_amount: input.amount,
    p_type: input.type,
    p_description: input.description || null,
    p_reference_id: input.referenceId || null,
    p_metadata: input.metadata || {}
  });

  if (error) {
    logger.payments.error("Atomic credit adjustment failed", error, { input });
    throw new Error(`Critical: Financial operation failed: ${error.message}`);
  }

  const result = data as any;
  return { 
    transactionId: result.transaction_id, 
    newBalance: result.new_balance 
  };
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
  metadata?: Record<string, unknown>;
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
