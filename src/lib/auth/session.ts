import { cache } from "react";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { UserRole } from "@/types";

export const getCurrentUser = cache(async () => {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export function getUserRole(user: Awaited<ReturnType<typeof requireUser>>): UserRole {
  const appMetadata = user.app_metadata as {
    role?: string;
  };

  return appMetadata.role === "admin" ? "admin" : "user";
}

export async function requireAdminUser() {
  const user = await requireUser();

  if (getUserRole(user) !== "admin") {
    redirect("/dashboard");
  }

  // Secondary DB check to guard against stale JWT after demotion.
  // Only runs when admin env is available (skip in offline/test mode).
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
      const adminClient = createSupabaseAdminClient();
      const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle<{ role: string }>();

      if (profile && profile.role !== "admin") {
        redirect("/dashboard");
      }
    } catch {
      // Non-critical: if DB check fails, fall through (JWT admin claim is still valid).
    }
  }

  return user;
}

export async function getAuthenticatedUserOrThrow() {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase ortam degiskenleri eksik.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Oturum dogrulanamadi.");
  }

  return user;
}
