import { NextRequest } from "next/server";
import { z } from "zod";

import { enforceRateLimit, getRateLimitKey } from "@/lib/rate-limiting/rate-limit-middleware";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/response";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { insertAnalyticsEvent } from "@/services/analytics/analytics-records";

// Define a rigorous schema for telemetry validation
const trackingSchema = z.object({
  event_name: z.string().min(1).max(50),
  session_id: z.string().min(1),
  page_url: z.string().url().or(z.string().startsWith("/")),
  referrer_url: z.string().nullable().optional(),
  event_properties: z.record(z.string(), z.any()).optional(),
  listing_id: z.string().uuid().nullable().optional(),
  seller_id: z.string().uuid().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticated context (optional, but captured if present)
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 2. Rate Limiting (Critical security layer for zero-cost infrastructure)
    // We group telemetry hits by IP primarily.
    // Setting a slightly higher limit than standard general API since browsing fires many events.
    const rateLimitKey = getRateLimitKey(request, "analytics_track", user?.id);
    const customAnalyticsLimit = { limit: 120, windowMs: 60 * 1000, failClosed: false }; // 120 events per minute

    const { response: limitExceededResponse } = await enforceRateLimit(
      rateLimitKey,
      customAnalyticsLimit
    );

    if (limitExceededResponse) {
      return limitExceededResponse;
    }

    // 3. Parse payload and safe extract client context from headers
    const body = await request.json();
    const validated = trackingSchema.safeParse(body);

    if (!validated.success) {
      return apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid payload", 400);
    }

    const userAgent = request.headers.get("user-agent");

    // Pull IP precisely from trustworthy headers
    const vercelForwarded = request.headers.get("x-vercel-forwarded-for");
    const clientIp =
      vercelForwarded?.split(",")[0]?.trim() ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";

    const {
      event_name,
      session_id,
      page_url,
      referrer_url,
      event_properties,
      listing_id,
      seller_id,
    } = validated.data;

    // 4. Enforce write (idempotent) async execution so we don't hold up user load
    // In Next.js App Router, server execution may abort if we return response before promise settles.
    // So we await the insert but swallow internal failure logs inside insertAnalyticsEvent
    await insertAnalyticsEvent({
      event_name,
      session_id,
      page_url,
      referrer_url: referrer_url || null,
      event_properties: event_properties || {},
      listing_id: listing_id || null,
      seller_id: seller_id || null,
      user_id: user?.id || null,
      ip_address: clientIp,
      user_agent: userAgent,
    });

    return apiSuccess({ tracked: true });
  } catch (error) {
    console.error("Fatal analytics routing error:", error);
    // Graceful degradation: never crash user experience if telemetry backend is lagging
    return apiSuccess({ tracked: false, status: "degraded" });
  }
}
