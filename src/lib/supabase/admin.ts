/* eslint-disable @typescript-eslint/no-explicit-any */
// ── SECURITY FIX: Issue #21 - Prevent Client Bundle Leakage ─────────────
// This import ensures that if this module is accidentally imported in a client
// component, the build will fail with a clear error message instead of silently
// bundling SUPABASE_SERVICE_ROLE_KEY into the client JavaScript.
import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdminEnv } from "@/lib/supabase/env";

/**
 * SECURITY CRITICAL: Creates a Supabase admin client using the SERVICE_ROLE_KEY.
 *
 * IMPORTANT RULES:
 * 1. This client BYPASSES ALL Row Level Security (RLS) policies.
 * 2. NEVER use this client to read/write data on behalf of a user in a user-facing route.
 * 3. ONLY use this for administrative tasks, system-level background jobs, or migrations.
 * 4. ALWAYS prefer createSupabaseServerClient() for user-authenticated requests.
 *
 * ── SECURITY FIX: Issue ADMIN-01 - Removed Module-Level Singleton ──────────────
 * Previous implementation used a module-level singleton that could be shared across
 * different user requests in serverless warm instances, creating a potential
 * cross-request contamination risk. Now creates a fresh client per invocation.
 *
 * Performance impact is negligible (~microseconds) and eliminates race conditions
 * and cross-request state leakage in serverless environments.
 */
export function createSupabaseAdminClient() {
  const { serviceRoleKey, url } = getSupabaseAdminEnv();
  return createClient<any>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
