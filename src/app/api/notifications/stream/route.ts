/**
 * GET /api/notifications/stream
 * 
 * SSE Realtime connection for user notifications.
 * Polls Upstash Redis for new messages targeting the authenticated user.
 */

import { Redis } from "@upstash/redis";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

// Upstash Redis instance (lazy loaded)
function getRedisClient() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    return process.env.NODE_ENV === "production" ? "https://otoburada.com" : "http://localhost:3000";
  }
  return url;
}

export async function GET(request: Request) {
  const isEventStream = request.headers.get("accept") === "text/event-stream";
  if (!isEventStream) {
    return new Response("Expected text/event-stream", { status: 406 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const redis = getRedisClient();
  if (!redis) {
    logger.notifications.error("Redis client unavailable for SSE stream");
    return new Response("Service Unavailable", { status: 503 });
  }

  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          // Stream already closed
        }
      };

      send('data: {"type":"connected"}\n\n');

      const key = `notifications:${userId}`;
      let lastCheck = Date.now();

      const poll = async () => {
        try {
          // Poll for new notifications since last check
          const newNotifications = await redis.zrange(key, lastCheck + 1, "+inf", { 
            byScore: true 
          });

          if (newNotifications && newNotifications.length > 0) {
            for (const notice of newNotifications) {
              send(`data: ${notice}\n\n`);
            }
            lastCheck = Date.now();
          }
          
          // Keep-alive heartbeat
          send(':\n\n');
        } catch (error) {
          logger.notifications.error("SSE Polling Error", error);
        }
      };

      intervalId = setInterval(poll, 5000);

      const onAbort = () => {
        if (intervalId) clearInterval(intervalId);
        try { controller.close(); } catch {}
      };

      request.signal.addEventListener("abort", onAbort);
    },
    cancel() {
      if (intervalId) clearInterval(intervalId);
    }
  });

  const appUrl = getAppUrl();
  
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform, no-store",
      "Connection": "keep-alive",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": appUrl,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}

export async function OPTIONS() {
  const appUrl = getAppUrl();
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": appUrl,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
      "Access-Control-Allow-Credentials": "true",
      "Max-Age": "86400",
    },
  });
}
