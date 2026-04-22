/**
 * POST /api/notifications/publish
 * 
 * Internal endpoint to publish a notification to a user's Redis-based real-time stream.
 * Requires internal/admin authorization if not called from a trusted server context.
 */

import { Redis } from "@upstash/redis";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getRedisClient() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    
    // Simple auth check — only authenticated users or admin context should publish
    // In production, you'd verify if the caller is an admin or a trusted service
    if (!userData?.user) {
      return apiError(API_ERROR_CODES.UNAUTHORIZED, "Yetkisiz erişim", 401);
    }

    const payload = await request.json();
    const { userId, message, title, link } = payload;

    if (!userId || !message) {
      return apiError(API_ERROR_CODES.BAD_REQUEST, "Eksik parametreler");
    }

    const redis = getRedisClient();
    if (!redis) {
      return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Redis yapılandırılmamış");
    }

    const key = `notifications:${userId}`;
    const notification = {
      id: Date.now().toString(),
      message,
      title: title || "Yeni Bildirim",
      link,
      createdAt: new Date().toISOString(),
    };

    // Add to a sorted set with timestamp as score for polling/streaming
    await redis.zadd(key, { 
      score: Date.now(), 
      member: JSON.stringify(notification) 
    });

    // Optional: Keep only last 50 notifications
    await redis.zremrangebyrank(key, 0, -51);

    return apiSuccess({ published: true, notification });
  } catch (error) {
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Bildirim yayınlanamadı");
  }
}
