import { NextResponse } from "next/server";
import { sendPhoneOTP } from "@/services/verification/phone-otp";
import { getCurrentUser } from "@/lib/auth/session";
import { getClientIp } from "@/lib/utils/ip";
import { checkGlobalRateLimit } from "@/lib/utils/distributed-rate-limit";
import { logger } from "@/lib/utils/logger";
import { captureServerError } from "@/lib/monitoring/posthog-server";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 401 });
  }

  const ip = await getClientIp();
  const { success: rateLimitSuccess } = await checkGlobalRateLimit(`otp_send_${ip}`);
  if (!rateLimitSuccess) {
    return NextResponse.json({ success: false, error: "Çok fazla istek. Lütfen biraz bekleyin." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "İstek gövdesi okunamadı." }, { status: 400 });
  }

  const { phone } = body as { phone?: string };
  if (!phone) {
    return NextResponse.json({ success: false, error: "Telefon numarası gerekli." }, { status: 400 });
  }

  try {
    const result = await sendPhoneOTP(phone);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: "Doğrulama kodu gönderildi." });
  } catch (error) {
    logger.sms.error("OTP send failed", error, { userId: user.id });
    captureServerError("OTP send failed", "sms", error, { userId: user.id });
    return NextResponse.json({ success: false, error: "Sunucu hatası." }, { status: 500 });
  }
}
