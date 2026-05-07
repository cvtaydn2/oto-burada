import type { User } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/features/shared/lib/admin";
import { hasSupabaseAdminEnv, hasSupabaseEnv } from "@/features/shared/lib/env";
import { API_ERROR_CODES, apiError } from "@/features/shared/lib/response";
import { createSupabaseServerClient } from "@/features/shared/lib/server";

/**
 * Short-lived cache to avoid redundant DB calls for admin checks within the same instance.
 * Cache TTL: 30 seconds
 */
const adminCheckCache = new Map<string, { role: string; isBanned: boolean; ts: number }>();
const CACHE_TTL_MS = 30 * 1000;
const MAX_CACHE_SIZE = 1000; // Prevent memory leaks by limiting cache growth

export async function requireApiAdminUser(existingUser?: User): Promise<User | Response> {
  if (!hasSupabaseEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
  }

  const user =
    existingUser ??
    (await (async () => {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    })());

  if (!user) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Oturum doğrulanamadı.", 401);
  }

  // Primary check: JWT app_metadata (fast, no extra DB call)
  const jwtRole = (user.app_metadata as { role?: string } | null | undefined)?.role ?? "user";

  if (jwtRole !== "admin") {
    return apiError(API_ERROR_CODES.FORBIDDEN, "Admin yetkisi gerekli.", 403);
  }

  // Secondary check: DB profiles.role (guards against stale JWT after demotion).
  if (!hasSupabaseAdminEnv()) {
    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "Admin doğrulaması şu anda kullanılamıyor.",
      503
    );
  }

  const adminClient = createSupabaseAdminClient();
  const now = Date.now();
  const cached = adminCheckCache.get(user.id);

  let profile: { role: string; is_banned?: boolean } | null = null;

  if (cached && now - cached.ts < CACHE_TTL_MS) {
    profile = { role: cached.role, is_banned: cached.isBanned };
  } else {
    const { data } = await adminClient
      .from("profiles")
      .select("role, is_banned")
      .eq("id", user.id)
      .maybeSingle<{ role: string; is_banned?: boolean }>();

    if (data) {
      profile = data;
      if (adminCheckCache.size >= MAX_CACHE_SIZE) adminCheckCache.clear();
      adminCheckCache.set(user.id, {
        role: data.role,
        isBanned: !!data.is_banned,
        ts: now,
      });
    }
  }

  if (!profile || profile.role !== "admin") {
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
export async function isSupabaseAdminUser(existingUser?: User): Promise<boolean> {
  if (!hasSupabaseEnv()) return false;

  const user =
    existingUser ??
    (await (async () => {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    })());

  if (!user) return false;

  const jwtRole = (user.app_metadata as { role?: string })?.role ?? "user";
  if (jwtRole !== "admin") return false;

  if (!hasSupabaseAdminEnv()) return false;

  const adminClient = createSupabaseAdminClient();
  const now = Date.now();
  const cached = adminCheckCache.get(user.id);

  let profile: { role: string; is_banned?: boolean } | null = null;

  if (cached && now - cached.ts < CACHE_TTL_MS) {
    profile = { role: cached.role, is_banned: cached.isBanned };
  } else {
    const { data } = await adminClient
      .from("profiles")
      .select("role, is_banned")
      .eq("id", user.id)
      .maybeSingle<{ role: string; is_banned?: boolean }>();

    if (data) {
      profile = data;
      if (adminCheckCache.size >= MAX_CACHE_SIZE) adminCheckCache.clear();
      adminCheckCache.set(user.id, {
        role: data.role,
        isBanned: !!data.is_banned,
        ts: now,
      });
    }
  }

  if (!profile || profile.role !== "admin") return false;
  if (profile.is_banned) return false;

  return true;
}
