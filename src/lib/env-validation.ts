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
  {
    key: "POSTHOG_WEBHOOK_SECRET",
    required: true,
    productionOnly: true,
    description: "Secret for PostHog webhook verification (openssl rand -hex 32)",
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
    } else {
      // ── SECURITY FIX: Issue SEC-11 - Weak Secret Check ─────────────────────
      // Prevent placeholder values or dangerously short secrets in production
      const isSecretKey = envVar.key.includes("SECRET") || envVar.key.includes("KEY");
      if (isProduction && isSecretKey) {
        const valueStr = value || "";
        const isPlaceholder = valueStr.includes("your-") || valueStr === "placeholder";
        const tooShort = valueStr.length < 32;

        if (isPlaceholder || tooShort) {
          const reason = isPlaceholder ? "placeholder value detected" : "too short (min 32 chars)";
          missing.push(`${envVar.key} (WEAK_SECRET: ${reason})`);
        }
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
 * Uses logger utility — safe to call at startup since logger only wraps console.
 */
export function logEnvValidation(): void {
  const result = validateEnv();
  const isProd = process.env.NODE_ENV === "production";

  if (result.missing.length > 0) {
    const message = `[ENV] ❌ Missing ${result.missing.length} required variables: ${result.missing.join(", ")}`;

    if (isProd) {
      // ── SECURITY FIX: Issue #41 - Production Env Validation ─────────────
      // Throw error in production to prevent silent failure and runtime crashes.
      // During build/CI, we skip the throw to allow the build to complete even if secrets are missing.
      // IMPORTANT: Vercel sets NEXT_PHASE during build, but runtime uses different phase values.
      // We check for CI/VERCEL env vars to detect build context more reliably.
      const isBuild = !!(
        process.env.CI ||
        process.env.VERCEL ||
        process.env.NEXT_PHASE === "phase-production-build"
      );

      if (!isBuild) {
        console.error(`${message} - SHUTTING DOWN DUE TO MISSING CONFIG`);
        // In production runtime, missing required vars should fail fast
        // This prevents silent failures that only surface on first request
        throw new Error(message);
      } else {
        console.error(`${message} - CONTINUING BUILD (CI DETECTED)`);
      }
    } else {
      console.error(message);
    }
  }

  if (result.warnings.length > 0 && !isProd) {
    console.warn(
      `[ENV] ⚠️  ${result.warnings.length} optional variables not set. Features may be degraded.`
    );
  }

  if (result.valid && result.warnings.length === 0 && !isProd) {
    console.info("[ENV] ✅ All environment variables validated");
  }
}
