/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
 * Rationale: Serverless functions (Vercel) can keep warm instances alive across
 * multiple invocations. If SUPABASE_SERVICE_ROLE_KEY is rotated while a warm
 * instance holds an old singleton, all admin requests will fail with 401/403.
 * Creating a new client per call is ~microseconds overhead and eliminates this risk.
 */
let cachedAdminClient: SupabaseClient<any> | null = null;
let adminClientCreatedAt = 0;
const ADMIN_CLIENT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * SECURITY CRITICAL: Creates a Supabase admin client using the SERVICE_ROLE_KEY.
 *
 * Implements a TTL-based singleton pattern to optimize connection pooling (reuse HTTP connections)
 * while allowing for periodic key rotation/refresh every 5 minutes.
 *
 * IMPORTANT RULES:
 * 1. This client BYPASSES ALL Row Level Security (RLS) policies.
 * 2. NEVER use this client to read/write data on behalf of a user in a user-facing route.
 * 3. ONLY use this for administrative tasks, system-level background jobs, or migrations.
 * 4. ALWAYS prefer createSupabaseServerClient() for user-authenticated requests.
 */
export function createSupabaseAdminClient(): SupabaseClient<any> {
  const now = Date.now();

  if (cachedAdminClient && now - adminClientCreatedAt < ADMIN_CLIENT_TTL) {
    return cachedAdminClient;
  }

  const { serviceRoleKey, url } = getSupabaseAdminEnv();
  cachedAdminClient = createClient<any>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  adminClientCreatedAt = now;
  return cachedAdminClient;
}
