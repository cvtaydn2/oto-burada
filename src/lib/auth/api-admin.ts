import type { User } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { API_ERROR_CODES, apiError } from "@/lib/utils/api-response";

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
  const jwtRole = (user.app_metadata as { role?: string } | null | undefined)?.role ?? "user";

  if (jwtRole !== "admin") {
    return apiError(API_ERROR_CODES.FORBIDDEN, "Admin yetkisi gerekli.", 403);
  }

  // Secondary check: DB profiles.role (guards against stale JWT after demotion).
  // Fail closed if admin env is unavailable — we cannot confirm the role is still valid.
  if (!hasSupabaseAdminEnv()) {
    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "Admin doğrulaması şu anda kullanılamıyor.",
      503
    );
  }

  const adminClient = createSupabaseAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, is_banned")
    .eq("id", user.id)
    .maybeSingle<{ role: string; is_banned?: boolean }>();

  if (!profile || profile.role !== "admin") {
    // DB must explicitly confirm admin role; null/missing profile fails closed.
    return apiError(API_ERROR_CODES.FORBIDDEN, "Admin yetkisi gerekli.", 403);
  }

  // Banned admins must also be blocked.
  if (profile.is_banned) {
    return apiError(API_ERROR_CODES.FORBIDDEN, "Hesabınız askıya alınmıştır.", 403);
  }

  return user;
}

/**
 * Lightweight check to see if current user is an admin.
 * Returns boolean instead of Response.
 * Used in routes with multi-factor auth (e.g. Cron or Admin).
 */
export async function isSupabaseAdminUser(): Promise<boolean> {
  if (!hasSupabaseEnv()) return false;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const jwtRole = (user.app_metadata as { role?: string })?.role ?? "user";
  if (jwtRole !== "admin") return false;

  // Fail closed if admin env is unavailable — cannot confirm role is still valid.
  if (!hasSupabaseAdminEnv()) return false;

  const adminClient = createSupabaseAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, is_banned")
    .eq("id", user.id)
    .maybeSingle<{ role: string; is_banned?: boolean }>();

  if (!profile || profile.role !== "admin") return false;
  if (profile.is_banned) return false;

  return true;
}
