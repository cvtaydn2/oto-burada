import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/supabase";

let client: SupabaseClient<Database> | undefined;

export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  if (client) return client;

  const { url, anonKey } = getSupabaseEnv();
  client = createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: true,
    },
  });

  return client;
}
