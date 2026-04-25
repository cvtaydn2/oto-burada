import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdminEnv, getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Creates a Supabase client with Service Role (bypasses RLS)
 */
export function getAdminClient() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Creates a Supabase client with Anon Key (subject to RLS)
 */
export function getAnonClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Simulates an authenticated user client
 */
export async function getAuthenticatedClient(_userId: string) {
  const _admin = getAdminClient();

  // In a real test environment, we would use admin.auth.admin.createServerSession
  // or similar, but for RLS testing we often just need to mock the JWT or use
  // a specific header if using a custom server.
  // In pure Supabase RLS testing, we usually use `auth.uid()` which is set by the JWT.

  // Since we are testing against a REAL Supabase (integration test),
  // we need a real session. This is hard without real email/password.

  // ALTERNATIVE: Use `set_config` in a transaction if we had direct DB access.
  // But we use the API.

  // For integration tests, we might need a test user.
  return getAnonClient(); // Placeholder: real implementation needs session management
}
