import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

let client: SupabaseClient<Database> | undefined;

export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  const { url, anonKey } = getSupabaseEnv();

  // ── SSR SAFETY: Issue BROWSER-01 ──────────────────────────────────────────
  // On server, always return a new client to avoid state leakage across requests.
  // Client Components are rendered once on the server for initial HTML.
  if (typeof window === "undefined") {
    return createBrowserClient<Database>(url, anonKey);
  }

  // On client, use singleton for performance and to keep single connection.
  if (client) return client;

  client = createBrowserClient<Database>(url, anonKey);
  return client;
}
