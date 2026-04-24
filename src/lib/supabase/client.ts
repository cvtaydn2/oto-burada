import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

import { getSupabaseEnv } from "./env";

let client: SupabaseClient<Database> | undefined;
let clientCreatedAt = 0;
const CLIENT_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

export function useSupabase(): SupabaseClient<Database> {
  const now = Date.now();
  if (client && now - clientCreatedAt < CLIENT_MAX_AGE_MS) return client;

  const { url, anonKey } = getSupabaseEnv();
  client = createBrowserClient<Database>(url, anonKey);
  clientCreatedAt = now;

  return client;
}

export function useAuth() {
  const supabase = useSupabase();
  return supabase.auth;
}
