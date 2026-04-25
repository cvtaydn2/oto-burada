import { redirect } from "next/navigation";
import { cache } from "react";

import { logger } from "@/lib/logging/logger";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export const getCurrentUser = cache(async () => {
  if (!hasSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    if (
      !supabase ||
      !("auth" in supabase) ||
      !supabase.auth ||
      typeof supabase.auth.getUser !== "function"
    ) {
      logger.auth.warn("[Session] Supabase client initialization failed");
      return null;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  } catch (error) {
    logger.auth.error("[Session] Failed to get current user", error);
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
/**
 * Verifies the user's role and status against the database as a final security measure.
 * Uses React cache to ensure this only hits the DB once per request.
 */
const getDBProfile = cache(async (userId: string) => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  try {
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    const adminClient = createSupabaseAdminClient();
    const { data: profile, error } = await adminClient
      .from("profiles")
      .select("role, is_banned")
      .eq("id", userId)
      .maybeSingle<{ role: string; is_banned: boolean }>();

    if (error || !profile) {
      if (error) {
        logger.auth.warn("[Session] DB profile check failed", { userId, error });
      }
      return null;
    }
    return {
      role: profile.role as UserRole,
      isBanned: !!profile.is_banned,
    };
  } catch (error) {
    logger.auth.error("[Session] Exception during DB profile check", error, { userId });
    return null;
  }
});

/**
 * Combined authentication context for the current request.
 * Bundles both the JWT-based user and the database-verified role.
 */
/**
 * Combined authentication context for the current request.
 * Bundles both the JWT-based user and the database-verified status.
 */
export const getAuthContext = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return { user: null, dbProfile: null };

  const dbProfile = await getDBProfile(user.id);
  return { user, dbProfile };
});

export async function requireAdminUser() {
  const { user, dbProfile } = await getAuthContext();

  if (!user) {
    redirect("/login");
  }

  // 1. Primary check (JWT)
  if (getUserRole(user) !== "admin") {
    redirect("/dashboard");
  }

  // 2. Secondary DB check (Atomic consistency)
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    if (!dbProfile || dbProfile.role !== "admin" || dbProfile.isBanned) {
      redirect("/dashboard");
    }
  }

  return user;
}

export async function getAuthenticatedUserOrThrow() {
  const { user } = await getAuthContext();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
