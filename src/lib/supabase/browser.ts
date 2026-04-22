"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/supabase/env";

let client: ReturnType<typeof createBrowserClient> | undefined;

export function createSupabaseBrowserClient() {
  if (client) return client;

  const { url, anonKey } = getSupabaseEnv();
  client = createBrowserClient(url, anonKey);

  return client;
}
