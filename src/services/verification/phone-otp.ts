import { Redis } from "@upstash/redis";
import { sms } from "@/lib/sms";
import { logger } from "@/lib/utils/logger";

const OTP_TTL = 300; // 5 minutes
let redisClient: Redis | null | undefined;

function getRedisClient() {
  if (redisClient !== undefined) {
    return redisClient;
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  return redisClient;
}

export async function sendPhoneOTP(phone: string): Promise<{ success: boolean; error?: string }> {
  // Normalize phone number (remove non-digits)
  const normalizedPhone = phone.replace(/\D/g, "");
  
  if (normalizedPhone.length < 10) {
    return { success: false, error: "Geçersiz telefon numarası." };
  }

  const redis = getRedisClient();
  if (!redis) {
    return { success: false, error: "Telefon doğrulama servisi şu anda kullanılamıyor." };
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
    logger.sms.error("sendPhoneOTP failed", error, { phone: normalizedPhone });
    return { success: false, error: "SMS gönderimi sırasında bir hata oluştu." };
  }
}

export async function verifyPhoneOTP(phone: string, code: string): Promise<{ success: boolean; error?: string }> {
  const normalizedPhone = phone.replace(/\D/g, "");
  const redis = getRedisClient();

  if (!redis) {
    return { success: false, error: "Telefon doğrulama servisi şu anda kullanılamıyor." };
  }
  
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
    logger.sms.error("verifyPhoneOTP failed", error, { phone: normalizedPhone });
    return { success: false, error: "Doğrulama sırasında bir hata oluştu." };
  }
}
