/**
 * GET /api/health
 *
 * Health check endpoint for Vercel, uptime monitors, and load balancers.
 * Returns 200 when the app is running and can reach Supabase.
 * Returns 503 when a critical dependency is unavailable.
 *
 * Response shape:
 * {
 *   status: "ok" | "degraded" | "down",
 *   version: string,          // git SHA or package version
 *   timestamp: string,        // ISO 8601
 *   checks: {
 *     database: "ok" | "error" | "skip",
 *     env: "ok" | "missing",
 *   }
 * }
 *
 * Security: no auth required — returns no sensitive data.
 * Rate limit: handled by global edge rate limiter in middleware.
 */

import { NextResponse } from "next/server";
import { hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/supabase/env";
import { checkInfrastructureHealth } from "@/lib/utils/infrastructure-health";
import { withSecurity } from "@/lib/utils/api-security";

export const dynamic = "force-dynamic";
// Short cache — health checks should reflect current state
export const revalidate = 0;

interface HealthResponse {
  status: "ok" | "degraded" | "down";
  version: string;
  timestamp: string;
  checks: {
    database: "ok" | "error" | "skip";
    redis: "ok" | "down" | "skip";
    env: "ok" | "missing";
  };
}

export async function GET(request: Request): Promise<NextResponse<HealthResponse>> {
  const security = await withSecurity(request);
  if (!security.ok) return security.response as NextResponse<HealthResponse>;

  const timestamp = new Date().toISOString();
  const version =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ??
    process.env.npm_package_version ??
    "unknown";

  // 1. Env check — are required vars present?
  const envOk = hasSupabaseEnv();

  // 2. Database check — can we reach Supabase?
  let dbStatus: "ok" | "error" | "skip" = "skip";

  if (hasSupabaseAdminEnv()) {
    try {
      const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
      const admin = createSupabaseAdminClient();
      // Lightweight ping: count a single row from a small table
      const { error } = await admin
        .from("pricing_plans")
        .select("id", { count: "exact", head: true })
        .limit(1);

      dbStatus = error ? "error" : "ok";
    } catch {
      dbStatus = "error";
    }
  }

  // 3. Infrastructure check (Redis + rate limiting)
  const infraHealth = await checkInfrastructureHealth();
  const redisStatus: "ok" | "down" | "skip" = infraHealth.redis ? "ok" : "down";

  // Determine overall status
  const status: HealthResponse["status"] =
    !envOk || dbStatus === "error"
      ? "down"
      : dbStatus === "skip" || !infraHealth.healthy
      ? "degraded"
      : "ok";

  const body: HealthResponse = {
    status,
    version,
    timestamp,
    checks: {
      database: dbStatus,
      redis: redisStatus,
      env: envOk ? "ok" : "missing",
    },
  };

  return NextResponse.json(body, {
    status: status === "down" ? 503 : 200,
    headers: {
      // Don't cache health checks at CDN level
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
