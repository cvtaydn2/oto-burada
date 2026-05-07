import type { User } from "@supabase/supabase-js";

import { hasSupabaseEnv } from "@/features/shared/lib/env";
import { API_ERROR_CODES, apiError } from "@/features/shared/lib/response";
import { createSupabaseServerClient } from "@/features/shared/lib/server";

export async function requireApiUser(): Promise<User | Response> {
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

  return user;
}
