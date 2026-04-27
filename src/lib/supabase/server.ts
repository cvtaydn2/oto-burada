import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "@/lib/supabase/env";

export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv();
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;

  try {
    cookieStore = await cookies();
  } catch (err) {
    // Only suppress cookie errors in non-request contexts (ISR, build-time)
    // In production requests, we want to know if cookies are unavailable
    const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";

    if (!isBuildTime && process.env.NODE_ENV === "production") {
      // Log warning in production requests - this might indicate a real issue
      const { logger } = await import("@/lib/logging/logger");
      logger.auth.warn("Cookie store unavailable in production request context", {
        error: err instanceof Error ? err.message : String(err),
      });
    }

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
