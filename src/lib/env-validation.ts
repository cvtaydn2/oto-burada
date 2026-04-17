/**
 * Startup environment validation.
 *
 * Called once during server initialization (via instrumentation.ts register()).
 * Logs a clear warning for each missing variable so operators know immediately
 * what's wrong instead of discovering it at request time.
 *
 * Does NOT throw — a missing optional var should degrade gracefully, not crash.
 * Required vars that are missing will cause runtime errors anyway; this just
 * surfaces them earlier with a clear message.
 */

interface EnvVar {
  key: string;
  required: boolean;
  description: string;
  /** If true, only validate in production */
  productionOnly?: boolean;
}

const ENV_VARS: EnvVar[] = [
  // ── Required ──────────────────────────────────────────────────────────────
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    required: true,
    description: "Supabase project URL",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    required: true,
    description: "Supabase anonymous key (public)",
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    required: true,
    description: "Supabase service role key (server-only, never expose to client)",
  },
  {
    key: "NEXT_PUBLIC_APP_URL",
    required: true,
    description: "Public app URL — used for CSRF, OG images, canonical URLs",
  },

  // ── Required in production ─────────────────────────────────────────────────
  {
    key: "CRON_SECRET",
    required: true,
    productionOnly: true,
    description: "Secret for Vercel Cron job authentication (openssl rand -hex 32)",
  },
  {
    key: "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN",
    required: true,
    productionOnly: true,
    description: "PostHog project token for analytics and error tracking",
  },

  // ── Optional but recommended ───────────────────────────────────────────────
  {
    key: "UPSTASH_REDIS_REST_URL",
    required: false,
    description: "Upstash Redis URL — required for distributed rate limiting",
  },
  {
    key: "UPSTASH_REDIS_REST_TOKEN",
    required: false,
    description: "Upstash Redis token — required for distributed rate limiting",
  },
  {
    key: "RESEND_API_KEY",
    required: false,
    description: "Resend API key — required for transactional emails",
  },
  {
    key: "SUPABASE_STORAGE_BUCKET_LISTINGS",
    required: false,
    description: "Supabase Storage bucket name for listing images",
  },
  {
    key: "SUPABASE_STORAGE_BUCKET_DOCUMENTS",
    required: false,
    description: "Supabase Storage bucket name for private documents (signed URLs)",
  },
];

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

export function validateEnv(): EnvValidationResult {
  const isProduction = process.env.NODE_ENV === "production";
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.key];
    const isEmpty = !value || value.trim() === "";

    // Skip production-only vars in non-production environments
    if (envVar.productionOnly && !isProduction) continue;

    if (isEmpty) {
      if (envVar.required) {
        missing.push(envVar.key);
      } else {
        warnings.push(`${envVar.key} — ${envVar.description}`);
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Log validation results. Called from instrumentation.ts register().
 * Uses console directly — logger.ts may not be initialized yet.
 */
export function logEnvValidation(): void {
  const result = validateEnv();

  if (result.missing.length > 0) {
    console.error(
      `[ENV] ❌ Missing required environment variables:\n${result.missing
        .map((k) => `  - ${k}`)
        .join("\n")}\n\nSet these in Vercel Project Settings > Environment Variables or .env.local`,
    );
  }

  if (result.warnings.length > 0 && process.env.NODE_ENV !== "production") {
    console.warn(
      `[ENV] ⚠️  Optional environment variables not set (features will be degraded):\n${result.warnings
        .map((w) => `  - ${w}`)
        .join("\n")}`,
    );
  }

  if (result.valid && result.warnings.length === 0) {
    console.info("[ENV] ✅ All environment variables validated");
  }
}
