import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/admin";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface HealthCheck {
  status: string;
  message?: string;
}

interface HealthCheckResponse {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  checks: Record<string, HealthCheck>;
  version?: string;
}

/**
 * Health Check Endpoint
 *
 * Bu endpoint production sisteminin sağlığını kontrol eder.
 * Vercel Cron veya UptimeRobot gibi servisler tarafından kullanılabilir.
 *
 * Güvenlik: CRON_SECRET ile korunur (opsiyonel)
 */
export async function GET(request: Request) {
  // SECURITY HARDENING: fail-closed — always require CRON_SECRET for this endpoint.
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowPrivilegedChecks = true;

  const response: HealthCheckResponse = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // 1. Environment Variables Check
  try {
    const requiredEnvs = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "NEXT_PUBLIC_APP_URL",
    ];

    const missingEnvs = requiredEnvs.filter((key) => !process.env[key]);

    if (missingEnvs.length > 0) {
      response.checks.environment = {
        status: "unhealthy",
        message: `Missing: ${missingEnvs.join(", ")}`,
      };
      response.status = "unhealthy";
    } else {
      response.checks.environment = {
        status: "healthy",
        message: "All required environment variables present",
      };
    }
  } catch (error) {
    response.checks.environment = {
      status: "unhealthy",
      message: String(error),
    };
    response.status = "unhealthy";
  }

  // 2. Supabase Connection Check
  try {
    if (!hasSupabaseEnv()) {
      response.checks.supabase = {
        status: "unhealthy",
        message: "Supabase environment not configured",
      };
      response.status = "unhealthy";
    } else {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase
        .from("profiles")
        .select("count", { count: "exact", head: true });

      if (error) {
        response.checks.supabase = {
          status: "unhealthy",
          message: error.message,
        };
        response.status = "unhealthy";
      } else {
        response.checks.supabase = {
          status: "healthy",
          message: "Database connection successful",
        };
      }
    }
  } catch (error) {
    response.checks.supabase = {
      status: "unhealthy",
      message: String(error),
    };
    response.status = "unhealthy";
  }

  // 3. Auth Configuration Check
  try {
    if (hasSupabaseEnv()) {
      const supabase = await createSupabaseServerClient();

      // Test auth endpoint (lightweight check)
      const { error } = await supabase.auth.getSession();

      if (error) {
        response.checks.auth = {
          status: "degraded",
          message: `Auth check warning: ${error.message}`,
        };
        if (response.status === "healthy") {
          response.status = "degraded";
        }
      } else {
        response.checks.auth = {
          status: "healthy",
          message: "Auth service accessible",
        };
      }
    }
  } catch (error) {
    response.checks.auth = {
      status: "degraded",
      message: String(error),
    };
    if (response.status === "healthy") {
      response.status = "degraded";
    }
  }

  // 4. Storage Check (opsiyonel)
  try {
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET_LISTINGS;

    if (!allowPrivilegedChecks) {
      response.checks.storage = {
        status: "degraded",
        message: "Storage check skipped (requires internal auth)",
      };
      if (response.status === "healthy") {
        response.status = "degraded";
      }
    } else if (bucketName) {
      const supabase = createSupabaseAdminClient();
      const { error } = await supabase.storage.getBucket(bucketName);

      if (error) {
        response.checks.storage = {
          status: "degraded",
          message: `Storage bucket check failed: ${error.message}`,
        };
        if (response.status === "healthy") {
          response.status = "degraded";
        }
      } else {
        response.checks.storage = {
          status: "healthy",
          message: "Storage bucket accessible",
        };
      }
    } else {
      response.checks.storage = {
        status: "healthy",
        message: "Storage not configured (optional)",
      };
    }
  } catch (error) {
    response.checks.storage = {
      status: "degraded",
      message: String(error),
    };
    if (response.status === "healthy") {
      response.status = "degraded";
    }
  }

  // 5. Critical Tables Check
  try {
    if (!allowPrivilegedChecks) {
      response.checks.database_tables = {
        status: "degraded",
        message: "Critical tables check skipped (requires internal auth)",
      };
      if (response.status === "healthy") {
        response.status = "degraded";
      }
    } else if (hasSupabaseEnv()) {
      const supabase = createSupabaseAdminClient();
      const tableChecks: string[] = [];

      const criticalTableChecks = [
        {
          label: "profiles",
          query: () => supabase.from("profiles").select("count", { count: "exact", head: true }),
        },
        {
          label: "listings",
          query: () => supabase.from("listings").select("count", { count: "exact", head: true }),
        },
        {
          label: "favorites",
          query: () => supabase.from("favorites").select("count", { count: "exact", head: true }),
        },
      ] as const;

      for (const table of criticalTableChecks) {
        const { error } = await table.query();

        if (error) {
          tableChecks.push(`${table.label}: ❌`);
          response.checks.database_tables = {
            status: "unhealthy",
            message: `Missing table: ${table.label}`,
          };
          response.status = "unhealthy";
          break;
        } else {
          tableChecks.push(`${table.label}: ✅`);
        }
      }

      if (!response.checks.database_tables) {
        response.checks.database_tables = {
          status: "healthy",
          message: tableChecks.join(", "),
        };
      }
    }
  } catch (error) {
    response.checks.database_tables = {
      status: "unhealthy",
      message: String(error),
    };
    response.status = "unhealthy";
  }

  // 6. Migrations Check
  try {
    if (!allowPrivilegedChecks) {
      response.checks.migrations = {
        status: "degraded",
        message: "Migrations check skipped (requires internal auth)",
      };
      if (response.status === "healthy") {
        response.status = "degraded";
      }
    } else if (hasSupabaseEnv()) {
      const supabase = createSupabaseAdminClient();
      const { count, error } = await supabase
        .from("_migrations")
        .select("*", { count: "exact", head: true });

      if (error) {
        response.checks.migrations = {
          status: "unhealthy",
          message: `Migrations table check failed: ${error.message}`,
        };
        response.status = "unhealthy";
      } else if (count === null || count === 0) {
        response.checks.migrations = {
          status: "degraded",
          message: "Migrations table is empty. Synchronization required.",
        };
        if (response.status === "healthy") {
          response.status = "degraded";
        }
      } else {
        response.checks.migrations = {
          status: "healthy",
          message: `Detected ${count} applied migrations`,
        };
      }
    }
  } catch (error) {
    response.checks.migrations = {
      status: "degraded",
      message: `Migration check error: ${String(error)}`,
    };
  }

  // HTTP status code based on health
  const statusCode =
    response.status === "healthy" ? 200 : response.status === "degraded" ? 200 : 503;

  return NextResponse.json(response, { status: statusCode });
}
