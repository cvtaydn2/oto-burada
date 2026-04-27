/* eslint-disable @typescript-eslint/no-explicit-any */
// ── SECURITY FIX: Issue #21 - Prevent Client Bundle Leakage ─────────────
// This import ensures that if this module is accidentally imported in a client
// component, the build will fail with a clear error message instead of silently
// bundling SUPABASE_SERVICE_ROLE_KEY into the client JavaScript.
import "server-only";

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
const ADMIN_CLIENT_TTL = 15 * 60 * 1000; // 15 minutes (balanced for connection pooling and key rotation)

/**
 * Resets the cached admin client.
 * Use this when encountering auth errors (401/403) to force client recreation.
 */
export function resetSupabaseAdminClient() {
  cachedAdminClient = null;
  adminClientCreatedAt = 0;
}

/**
 * SECURITY CRITICAL: Creates a Supabase admin client using the SERVICE_ROLE_KEY.
 * Implements a short-lived TTL-based singleton pattern to optimize connection pooling
 * while allowing for fast recovery after key rotation.
 */
export function createSupabaseAdminClient() {
  const now = Date.now();
  const isExpired = now - adminClientCreatedAt > ADMIN_CLIENT_TTL;

  if (cachedAdminClient && !isExpired) {
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
