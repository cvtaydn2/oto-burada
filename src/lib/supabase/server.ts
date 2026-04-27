import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { isRequestContext } from "@/lib/next-context";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv();
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;

  const canAccessCookies = isRequestContext();

  if (canAccessCookies) {
    try {
      cookieStore = await cookies();
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        const { logger } = await import("@/lib/logging/logger");
        logger.auth.warn("Cookie store failed in request context", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
      cookieStore = null;
    }
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
