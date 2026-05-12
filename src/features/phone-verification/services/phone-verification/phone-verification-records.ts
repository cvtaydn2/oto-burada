import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/supabase";

export type PhoneVerification = Database["public"]["Tables"]["phone_verifications"]["Row"];

/**
 * SECURITY CRITICAL: Interacts with sensitive ephemeral table that strictly guards OTP codes.
 * Uses admin client bypass to read/write codes because this data MUST NOT be readable via user RLS policies.
 */

/**
 * Registers a new OTP session tracking entry.
 */
export async function createVerificationRecord(
  userId: string,
  phone: string,
  code: string,
  ttlMinutes: number = 5
) {
  const supabase = createSupabaseAdminClient();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

  const { data, error } = await supabase
    .from("phone_verifications")
    .insert({
      user_id: userId,
      phone: phone,
      code: code,
      expires_at: expiresAt.toISOString(),
      attempts: 0,
    })
    .select("id, user_id, phone, code, expires_at, attempts, created_at, verified_at")
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetches the latest active (non-expired) pending session for a given user.
 */
export async function getActiveVerificationRecord(userId: string) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("phone_verifications")
    .select("id, user_id, phone, code, expires_at, attempts, created_at, verified_at")
    .eq("user_id", userId)
    .is("verified_at", null)
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Safely records an incorrect attempt counter increment to enforce brute-force limits.
 */
export async function incrementAttemptCounter(verificationId: string, currentAttempts: number) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("phone_verifications")
    .update({
      attempts: currentAttempts + 1,
    })
    .eq("id", verificationId);

  if (error) throw error;
}

/**
 * Closes a successful validation cycle and marks verification record consumed.
 */
export async function markVerificationSucceeded(verificationId: string) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("phone_verifications")
    .update({
      verified_at: now,
    })
    .eq("id", verificationId);

  if (error) throw error;
}

/**
 * Authoritative state mutation that confirms the specific phone binding on target profile store.
 */
export async function finalizeProfilePhoneVerification(userId: string, phone: string) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("profiles")
    .update({
      phone: phone,
      is_phone_verified: true,
      phone_verified_at: now,
    })
    .eq("id", userId);

  if (error) throw error;
}
