import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "@/lib/supabase/env";

export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv();
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;

  try {
    cookieStore = await cookies();
  } catch {
    cookieStore = null;
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore?.getAll() ?? [];
      },
      setAll(cookiesToSet) {
        if (!cookieStore) return;
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components içinde cookie yazımı gerekmeyen çağrılarda sessiz geçilir.
        }
      },
    },
  });
}
