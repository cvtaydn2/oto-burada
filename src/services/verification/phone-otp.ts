import { Redis } from "@upstash/redis";
import { sms } from "@/lib/sms";
import { nanoid } from "nanoid";

const redis = Redis.fromEnv();
const OTP_TTL = 300; // 5 minutes

export async function sendPhoneOTP(phone: string): Promise<{ success: boolean; error?: string }> {
  // Normalize phone number (remove non-digits)
  const normalizedPhone = phone.replace(/\D/g, "");
  
  if (normalizedPhone.length < 10) {
    return { success: false, error: "Geçersiz telefon numarası." };
  }

  // Generate a 4-6 digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  try {
    // Store in Redis: phone -> code
    await redis.set(`otp:${normalizedPhone}`, code, { ex: OTP_TTL });
    
    const smsResult = await sms.send({
      to: normalizedPhone.startsWith("+") ? normalizedPhone : `+90${normalizedPhone}`,
      body: `OtoBurada dogrulama kodunuz: ${code}`
    });

    if (!smsResult.success) {
      return { success: false, error: smsResult.error };
    }

    return { success: true };
  } catch (error) {
    console.error("SMS OTP Send Error:", error);
    return { success: false, error: "SMS gönderimi sırasında bir hata oluştu." };
  }
}

export async function verifyPhoneOTP(phone: string, code: string): Promise<{ success: boolean; error?: string }> {
  const normalizedPhone = phone.replace(/\D/g, "");
  
  try {
    const storedCode = await redis.get(`otp:${normalizedPhone}`);
    
    if (!storedCode) {
      return { success: false, error: "Doğrulama kodunun süresi dolmuş veya geçersiz." };
    }
    
    if (storedCode !== code) {
      return { success: false, error: "Hatalı doğrulama kodu." };
    }
    
    // Code is correct, remove it from Redis
    await redis.del(`otp:${normalizedPhone}`);
    
    return { success: true };
  } catch (error) {
    console.error("SMS OTP Verify Error:", error);
    return { success: false, error: "Doğrulama sırasında bir hata oluştu." };
  }
}
