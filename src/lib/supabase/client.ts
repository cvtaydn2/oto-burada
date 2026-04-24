import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

import { getSupabaseEnv } from "./env";

// Browser-only singleton — safe because browser has a single user context.
// SSR path always creates a new instance to prevent cross-request session leaks.
let _browserClient: SupabaseClient<Database> | undefined;

export function useSupabase(): SupabaseClient<Database> {
  const { url, anonKey } = getSupabaseEnv();

  // SSR: always create a new instance to prevent cross-request session leaks.
  if (typeof window === "undefined") {
    return createBrowserClient<Database>(url, anonKey);
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
