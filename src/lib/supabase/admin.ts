/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseAdminEnv } from "@/lib/supabase/env";

let _adminClient: SupabaseClient<any> | null = null;

export function getSupabaseAdminClient() {
  if (_adminClient) return _adminClient;

  const { serviceRoleKey, url } = getSupabaseAdminEnv();

  _adminClient = createClient<any>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _adminClient;
}

export const createSupabaseAdminClient = getSupabaseAdminClient;
