import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

import { getSupabaseEnv } from "./env";

let client: SupabaseClient<Database> | undefined;

export function useSupabase(): SupabaseClient<Database> {
  if (!client) {
    const { url, anonKey } = getSupabaseEnv();
    client = createBrowserClient<Database>(url, anonKey);
  }
  return client;
}

export function useAuth() {
  const supabase = useSupabase();
  return supabase.auth;
}
