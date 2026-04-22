import { cache } from "react";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { UserRole } from "@/types";

export const getCurrentUser = cache(async () => {
  if (!hasSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase || !("auth" in supabase) || !supabase.auth || typeof supabase.auth.getUser !== "function") {
      return null;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  } catch {
    return null;
  }
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

/**
 * Verifies the user's role against the database as a final security measure.
 * Uses React cache to ensure this only hits the DB once per request.
 */
const getDBUserRole = cache(async (userId: string) => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  try {
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    const adminClient = createSupabaseAdminClient();
    const { data: profile, error } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle<{ role: string }>();

    if (error || !profile) return null;
    return profile.role as UserRole;
  } catch {
    return null;
  }
});

export async function requireAdminUser() {
  const user = await requireUser();

  // 1. Check JWT claims (fast, covers 99% of cases)
  if (getUserRole(user) !== "admin") {
    redirect("/dashboard");
  }

  // 2. Secondary DB check to guard against stale JWT after demotion.
  // Fails CLOSED — if the DB check throws or returns non-admin, deny access.
  const dbRole = await getDBUserRole(user.id);
  
  // dbRole null means either env missing or not found/error.
  // We only allow if dbRole is explicitly "admin".
  // If env is missing (local dev), we fallback to JWT check only (convenience).
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && dbRole !== "admin") {
    redirect("/dashboard");
  }

  return user;
}

export async function getAuthenticatedUserOrThrow() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}
