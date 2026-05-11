"use server";

import { z } from "zod";

import { requireUser } from "@/features/auth/lib/session";
import { logger } from "@/lib/logger";

import { attemptPhoneVerification, initiatePhoneVerification } from "./phone-verification-logic";

const phoneInputSchema = z
  .string()
  .min(10)
  .max(15)
  .regex(/^\+?[1-9]\d{1,14}$/);
const codeInputSchema = z
  .string()
  .length(6)
  .regex(/^\d{6}$/);

export type PhoneVerificationActionResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string; code?: string };

/**
 * Starts the SMS verification flow by creating a pending code
 * and triggering dispatch.
 */
export async function initiatePhoneVerificationAction(
  phone: string
): Promise<PhoneVerificationActionResult> {
  try {
    // 1. Authenticate
    const user = await requireUser();

    // 2. Validate minimal phone pattern
    const parseResult = phoneInputSchema.safeParse(phone);
    if (!parseResult.success) {
      return {
        status: "error",
        message: "Geçersiz telefon formatı. Lütfen rakam kullandığınızdan emin olun.",
      };
    }

    // 3. Execute Logic Layer
    await initiatePhoneVerification(user.id, parseResult.data);

    return {
      status: "success",
      message: "Doğrulama kodu telefonunuza SMS olarak gönderildi.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    logger.auth.error("[PhoneVerificationAction] Failed to initiate", null, { error: message });
    return {
      status: "error",
      message: message || "Doğrulama kodu gönderilirken hata oluştu.",
    };
  }
}

/**
 * Validates a typed user OTP against the active verification state.
 * On success, definitively unlocks phone_verified flag in DB.
 */
export async function verifyPhoneCodeAction(
  phone: string,
  code: string
): Promise<PhoneVerificationActionResult> {
  try {
    // 1. Authenticate
    const user = await requireUser();

    // 2. Validate inputs
    const phoneParsed = phoneInputSchema.safeParse(phone);
    const codeParsed = codeInputSchema.safeParse(code);

    if (!phoneParsed.success || !codeParsed.success) {
      return {
        status: "error",
        message: "Eksik veya geçersiz veri girişi.",
      };
    }

    // 3. Execute Logic Layer validation
    const success = await attemptPhoneVerification(user.id, codeParsed.data);

    if (!success) {
      return {
        status: "error",
        message: "Kod doğrulanamadı veya hatalı giriş deneme limitini aştınız.",
      };
    }

    return {
      status: "success",
      message: "Telefon numaranız başarıyla doğrulandı.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    logger.auth.error("[PhoneVerificationAction] Failed to verify", null, { error: message });
    return {
      status: "error",
      message: message || "Doğrulama işlemi sırasında hata oluştu.",
    };
  }
}
