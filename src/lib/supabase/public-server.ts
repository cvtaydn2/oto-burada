/**
 * Public Supabase Server Client
 *
 * SECURITY: This client uses the anon key and respects RLS policies.
 * Use this for public read operations where RLS should be enforced.
 *
 * Principle of Least Privilege:
 * - Public reads: Use this client (RLS enforced)
 * - Authenticated operations: Use createSupabaseServerClient() (user context)
 * - Admin operations: Use createSupabaseAdminClient() (RLS bypassed)
 *
 * DO NOT use admin client for public listing queries!
 */

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

let publicClient: ReturnType<typeof createClient<Database>> | null = null;
let clientCreatedAt = 0;
const CLIENT_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Creates a public Supabase client for server-side operations.
 * Uses lazy initialization with max-age to prevent stale connections in serverless environments.
 */
export function createSupabasePublicServerClient() {
  const now = Date.now();

  if (publicClient && now - clientCreatedAt < CLIENT_MAX_AGE_MS) {
    return publicClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables for public client");
  }

  publicClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  clientCreatedAt = now;
  return publicClient;
}

/**
 * Helper to check if we should use public client vs admin client.
 *
 * Use public client when:
 * - Reading public data (approved listings, public profiles)
 * - No cross-user access needed
 * - RLS policies should be enforced
 *
 * Use admin client when:
 * - Admin operations (moderation, user management)
 * - Cross-user queries with explicit authorization
 * - System operations (cron jobs, webhooks)
 */
export function shouldUsePublicClient(operation: {
  type: "read" | "write" | "admin";
  isPublicData: boolean;
  requiresCrossUserAccess: boolean;
}): boolean {
  return operation.type === "read" && operation.isPublicData && !operation.requiresCrossUserAccess;
}
