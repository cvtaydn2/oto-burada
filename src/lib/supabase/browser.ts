import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/supabase";

let client: SupabaseClient<Database> | undefined;

export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  // ── SECURITY FIX: Issue BROWSER-01 - SSR Guard for Browser Client ──────────
  // Prevent browser client from being used in server context, which could cause
  // session leakage across different user requests in serverless environments.
  if (typeof window === "undefined") {
    throw new Error(
      "createSupabaseBrowserClient() called in server context. Use createSupabaseServerClient() instead."
    );
  }

  if (client) return client;

  const { url, anonKey } = getSupabaseEnv();
  client = createBrowserClient<Database>(url, anonKey);

  return client;
}
