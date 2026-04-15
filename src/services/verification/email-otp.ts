"use server";

/**
 * Email OTP verification using Supabase Auth built-in OTP.
 * No Redis, no SMS — Supabase sends the email directly.
 *
 * Supabase Dashboard → Authentication → Email Templates → OTP
 * adresinden email şablonunu özelleştirebilirsin.
 *
 * SMTP ayarı için:
 * Supabase Dashboard → Project Settings → Auth → SMTP Settings
 * Kendi mail adresini (Gmail, Resend vb.) buraya ekle.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

export async function sendEmailOTP(email: string): Promise<{ success: boolean; error?: string }> {
  if (!email || !email.includes("@")) {
    return { success: false, error: "Geçersiz e-posta adresi." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // Sadece mevcut kullanıcılara gönder
      },
    });

    if (error) {
      logger.auth.warn("Email OTP send failed", { message: error.message, email });
      return { success: false, error: "Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin." };
    }

    return { success: true };
  } catch (error) {
    logger.auth.error("Email OTP send unexpected error", error, { email });
    return { success: false, error: "Sunucu hatası." };
  }
}

export async function verifyEmailOTP(
  email: string,
  token: string,
): Promise<{ success: boolean; error?: string }> {
  if (!email || !token) {
    return { success: false, error: "E-posta ve kod gerekli." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      logger.auth.warn("Email OTP verify failed", { message: error.message });
      return { success: false, error: "Geçersiz veya süresi dolmuş doğrulama kodu." };
    }

    return { success: true };
  } catch (error) {
    logger.auth.error("Email OTP verify unexpected error", error);
    return { success: false, error: "Sunucu hatası." };
  }
}

/**
 * Şifre sıfırlama için email gönder (Supabase built-in).
 */
export async function sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
  if (!email || !email.includes("@")) {
    return { success: false, error: "Geçersiz e-posta adresi." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl.replace(/\/$/, "")}/auth/callback?next=/reset-password`,
    });

    if (error) {
      logger.auth.warn("Password reset email failed", { message: error.message });
      // Güvenlik: kullanıcıya hesap var/yok bilgisi verme
      return { success: true };
    }

    return { success: true };
  } catch (error) {
    logger.auth.error("Password reset unexpected error", error);
    return { success: false, error: "Sunucu hatası." };
  }
}
