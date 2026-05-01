import { createSupabaseBrowserClient } from "./browser";
import { createSupabaseServerClient } from "./server";

/**
 * Universal Supabase client factory that works in both server and browser contexts.
 *
 * NOTE: This must be called inside an async context (Server Action, Server Component,
 * or async Client Component function).
 */
export async function getSupabaseClient() {
  if (typeof window === "undefined") {
    return await createSupabaseServerClient();
  }
  return createSupabaseBrowserClient();
}
