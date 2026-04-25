import type { User } from "@supabase/supabase-js";

import { API_ERROR_CODES, apiError } from "@/lib/api/response";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
