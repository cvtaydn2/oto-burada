import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "@/features/shared/lib/env";
import { isRequestContext } from "@/lib/next-context";

export async function createSupabaseServerClient(overrideUrl?: string) {
  const { url: defaultUrl, anonKey } = getSupabaseEnv();
  const url = overrideUrl || defaultUrl;
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;

  const canAccessCookies = await isRequestContext();

  if (canAccessCookies) {
    try {
      cookieStore = await cookies();
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        const { logger } = await import("@/features/shared/lib/logger");
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
