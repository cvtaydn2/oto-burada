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

/**
 * Creates a singleton public Supabase client for server-side operations.
 * This client uses the anon key and respects RLS policies.
 *
 * Use Cases:
 * - Public listing queries (marketplace, search, detail pages)
 * - Public profile views
 * - Any read operation that should respect RLS
 *
 * DO NOT USE FOR:
 * - Admin operations (use createSupabaseAdminClient)
 * - Cross-user queries (use createSupabaseAdminClient with explicit checks)
 * - Write operations (use createSupabaseServerClient with user context)
 */
export function createSupabasePublicServerClient() {
  if (publicClient) {
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
