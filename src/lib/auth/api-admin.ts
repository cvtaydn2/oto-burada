import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
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

  const role =
    (user.app_metadata as {
      role?: string;
    } | null | undefined)?.role ?? "user";

  if (role !== "admin") {
    return apiError(API_ERROR_CODES.FORBIDDEN, "Admin yetkisi gerekli.", 403);
  }

  return user;
}
