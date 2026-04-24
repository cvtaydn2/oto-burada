/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseAdminEnv } from "@/lib/supabase/env";

/**
 * Creates a fresh Supabase admin client per call.
 *
 * Rationale: Serverless functions (Vercel) can keep warm instances alive across
 * multiple invocations. If SUPABASE_SERVICE_ROLE_KEY is rotated while a warm
 * instance holds an old singleton, all admin requests will fail with 401/403.
 * Creating a new client per call is ~microseconds overhead and eliminates this risk.
 *
 * Note: @supabase/supabase-js internals share the underlying fetch (no TCP overhead).
 */
export function createSupabaseAdminClient(): SupabaseClient<any> {
  const { serviceRoleKey, url } = getSupabaseAdminEnv();
  return createClient<any>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Backward compatibility alias
export const getSupabaseAdminClient = createSupabaseAdminClient;
