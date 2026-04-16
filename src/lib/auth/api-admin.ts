import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv, hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { apiError, API_ERROR_CODES } from "@/lib/utils/api-response";

export async function requireApiAdminUser(): Promise<User | Response> {
  if (!hasSupabaseEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Oturum doğrulanamadı.", 401);
  }

  // Primary check: JWT app_metadata (fast, no extra DB call)
  const jwtRole =
    (user.app_metadata as { role?: string } | null | undefined)?.role ?? "user";

  if (jwtRole !== "admin") {
    return apiError(API_ERROR_CODES.FORBIDDEN, "Admin yetkisi gerekli.", 403);
  }

  // Secondary check: DB profiles.role (guards against stale JWT after demotion).
  // If the admin env is not available we trust the JWT alone — acceptable fallback.
  if (hasSupabaseAdminEnv()) {
    const adminClient = createSupabaseAdminClient();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: string }>();

    if (profile && profile.role !== "admin") {
      // DB says not admin — JWT may be stale after demotion. Reject.
      return apiError(API_ERROR_CODES.FORBIDDEN, "Admin yetkisi gerekli.", 403);
    }
  }

  return user;
}
