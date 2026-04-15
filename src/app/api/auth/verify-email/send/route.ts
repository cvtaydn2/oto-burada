import { NextResponse } from "next/server";
import { sendEmailOTP } from "@/services/verification/email-otp";
import { getCurrentUser } from "@/lib/auth/session";
import { getClientIp } from "@/lib/utils/ip";
import { checkGlobalRateLimit } from "@/lib/utils/distributed-rate-limit";
import { logger } from "@/lib/utils/logger";
import { captureServerError } from "@/lib/monitoring/posthog-server";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 401 });
  }

  const ip = await getClientIp();
  const { success: rateLimitSuccess } = await checkGlobalRateLimit(`email_otp_send_${ip}`);
  if (!rateLimitSuccess) {
    return NextResponse.json({ success: false, error: "Çok fazla istek. Lütfen biraz bekleyin." }, { status: 429 });
  }

  const email = user.email;
  if (!email) {
    return NextResponse.json({ success: false, error: "Hesabınızda e-posta adresi bulunamadı." }, { status: 400 });
  }

  try {
    const result = await sendEmailOTP(email);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: "Doğrulama kodu e-posta adresinize gönderildi." });
  } catch (error) {
    logger.auth.error("Email OTP send route failed", error, { userId: user.id });
    captureServerError("Email OTP send route failed", "auth", error, { userId: user.id });
    return NextResponse.json({ success: false, error: "Sunucu hatası." }, { status: 500 });
  }
}
