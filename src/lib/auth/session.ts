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
  // Fails CLOSED — if the DB check throws, we deny access rather than
  // silently granting it. Only skipped when admin env is not configured
  // (offline / test mode).
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    const adminClient = createSupabaseAdminClient();
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: string }>();

    // DB error or profile missing → fail closed (deny access)
    if (profileError || !profile || profile.role !== "admin") {
      redirect("/dashboard");
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
