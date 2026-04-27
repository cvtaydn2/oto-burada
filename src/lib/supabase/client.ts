import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

import { getSupabaseEnv } from "./env";

// Browser-only singleton — safe because browser has a single user context.
// SSR path always creates a new instance to prevent cross-request session leaks.
let _browserClient: SupabaseClient<Database> | undefined;

/**
 * ── BUG FIX: Issue BUG-02 - SSR Client Type Safety ───────────
 * IMPORTANT: This hook should ONLY be used in Client Components.
 * For Server Components, use createSupabaseServerClient() instead.
 *
 * SSR Note: If called during SSR (which shouldn't happen), we throw an error
 * to prevent using browser client in server context, which would cause
 * cross-request session leaks and authentication failures.
 */
export function useSupabase(): SupabaseClient<Database> {
  const { url, anonKey } = getSupabaseEnv();

  // ── BUG FIX: Issue BUG-02 - Explicit SSR Guard ─────────────
  // Throw error immediately if called in server context to prevent
  // cross-request session leaks and authentication failures
  if (typeof window === "undefined") {
    throw new Error(
      "useSupabase() called in server context. Use createSupabaseServerClient() for Server Components."
    );
  }

  // Browser: reuse singleton — safe, single user context.
  if (!_browserClient) {
    _browserClient = createBrowserClient<Database>(url, anonKey);
  }
  return _browserClient;
}

export function useAuth() {
  const supabase = useSupabase();
  return supabase.auth;
}
