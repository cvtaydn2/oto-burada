import { NextResponse } from "next/server";
import { sendPhoneOTP } from "@/services/verification/phone-otp";
import { getCurrentUser } from "@/lib/auth/session";
import { getClientIp } from "@/lib/utils/ip";
import { checkGlobalRateLimit } from "@/lib/utils/distributed-rate-limit";

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

  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ success: false, error: "Telefon numarası gerekli." }, { status: 400 });
    }

    const result = await sendPhoneOTP(phone);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Doğrulama kodu gönderildi." });
  } catch (error) {
    console.error("API OTP Send Error:", error);
    return NextResponse.json({ success: false, error: "Sunucu hatası." }, { status: 500 });
  }
}
