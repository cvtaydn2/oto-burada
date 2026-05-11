import "server-only";

import { randomInt } from "crypto";

import * as records from "./phone-verification-records";
import { getSMSClient } from "./sms-client";

const MAX_ATTEMPTS = 3;
const OTP_EXPIRY_MINUTES = 10;

/**
 * Pure token synthesization generating standard 6-digit secret.
 */
function generateNumericOTP(): string {
  // Cryptographically safe integer generation bounded [100000, 999999]
  return randomInt(100000, 999999).toString();
}

/**
 * Initiates entire verification lifecycle: synth OTP, persist session, dispatch notify.
 */
export async function initiatePhoneVerification(userId: string, rawPhone: string) {
  // 1. Generate Secure OTP
  const otp = generateNumericOTP();

  // 2. Store ephemeral session
  await records.createVerificationRecord(userId, rawPhone, otp, OTP_EXPIRY_MINUTES);

  // 3. Hand off to resilient transmission channel
  const client = getSMSClient();
  const message = `OtoBurada doğrulama kodunuz: ${otp}. Güvenliğiniz için kimseyle paylaşmayın.`;

  const result = await client.send({
    to: rawPhone,
    body: message,
  });

  return {
    success: result.success,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
  };
}

/**
 * Decisive challenge orchestration layer enforcing attempt limits and persistence commitment.
 */
export async function attemptPhoneVerification(userId: string, submittedCode: string) {
  // 1. Retrieve most recent eligible record
  const activeRecord = await records.getActiveVerificationRecord(userId);

  if (!activeRecord) {
    throw new Error(
      "Aktif bir doğrulama talebi bulunamadı veya süresi dolmuş. Lütfen tekrar deneyin."
    );
  }

  // 2. Strict threshold guard check
  if (activeRecord.attempts >= MAX_ATTEMPTS) {
    throw new Error("Çok fazla hatalı deneme yaptınız. Lütfen yeni bir kod talep edin.");
  }

  // 3. Perform precise equality check
  const matches = activeRecord.code.trim() === submittedCode.trim();

  if (!matches) {
    // Increment failure counter transparently to block future cycles
    await records.incrementAttemptCounter(activeRecord.id, activeRecord.attempts);

    const remaining = MAX_ATTEMPTS - (activeRecord.attempts + 1);
    throw new Error(
      `Hatalı kod. ${remaining > 0 ? `${remaining} deneme hakkınız kaldı.` : "Deneme hakkınız bitti. Yeni kod talep edin."}`
    );
  }

  // 4. Finalize commitment cascade
  // Mark specific challenge as redeemed
  await records.markVerificationSucceeded(activeRecord.id);

  // Authoritatively bind phone state to owner identity persistence layer
  await records.finalizeProfilePhoneVerification(userId, activeRecord.phone);

  return {
    success: true,
    verifiedPhone: activeRecord.phone,
  };
}
