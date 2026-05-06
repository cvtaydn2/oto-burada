import { redirect } from "next/navigation";
import { cache } from "react";

import { logger } from "@/lib/logging/logger";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

import { getSessionContext } from "./session-context";

async function resolveCurrentUser() {
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
}

export const getCurrentUser = cache(async () => {
  const context = getSessionContext();
  if (context) return context.user;
  return resolveCurrentUser();
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
  try {
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (hasServiceKey) {
      const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
      const adminClient = createSupabaseAdminClient();
      const { data: profile, error } = await adminClient
        .from("profiles")
        .select("role, is_banned")
        .eq("id", userId)
        .limit(1)
        .maybeSingle<{ role: string; is_banned: boolean }>();

      if (error || !profile) {
        if (error) {
          logger.auth.warn("[Session] DB profile check failed (admin client)", { userId, error });
        }
        return null;
      }

      return {
        role: profile.role as UserRole,
        isBanned: !!profile.is_banned,
      };
    }

    const supabase = await createSupabaseServerClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, is_banned")
      .eq("id", userId)
      .limit(1)
      .maybeSingle<{ role: string; is_banned: boolean }>();

    if (error || !profile) {
      if (error) {
        logger.auth.warn("[Session] DB profile check failed (server client)", { userId, error });
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
 *
 * ── BUG FIX: Issue BUG-12 - AsyncLocalStorage Context Fallback ─────────────
 * The AsyncLocalStorage context should be set by middleware for all requests.
 * If context is missing, we fall back to standard request-scoped cache.
 *
 * NOTE: If fallback is always triggered, verify that middleware is properly
 * setting the context via setSessionContext() for all authenticated routes.
 */
export const getAuthContext = cache(async () => {
  // 1. Try to get from AsyncLocalStorage (set by middleware or wrapper)
  const context = getSessionContext();
  if (context) return context;

  // 2. Fallback to standard request-scoped cache (e.g. for ISR/revalidation)
  const user = await getCurrentUser();
  if (!user) return { user: null, dbProfile: null };

  const dbProfile = await getDBProfile(user.id);
  return { user, dbProfile };
});

export async function requireAdminUser() {
  const { user, dbProfile } = await getAuthContext();

  if (!user) {
    logger.auth.info("[requireAdminUser] No user session found. Redirecting to login.");
    redirect("/login");
  }

  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isJwtAdmin = (user.app_metadata as { role?: string })?.role === "admin";
  const isVerifiedAdmin = dbProfile?.role === "admin" && !dbProfile.isBanned;

  // DB verification is mandatory in every environment.
  if (isVerifiedAdmin) {
    return user;
  }

  logger.auth.warn("[requireAdminUser] Access denied.", {
    userId: user.id,
    email: user.email,
    dbRole: dbProfile?.role,
    jwtRole: isJwtAdmin ? "admin" : "user",
    hasServiceKey,
  });

  // JWT admin claim is never enough without DB verification.
  if (isJwtAdmin) {
    if (dbProfile?.isBanned) {
      throw new Error("Hesabınız askıya alınmıştır.");
    }

    if (!dbProfile) {
      logger.auth.error(
        "[requireAdminUser] JWT admin claim could not be verified against DB profile",
        { userId: user.id, hasServiceKey }
      );
      throw new Error("Admin yetkisi doğrulanamadı. Lütfen tekrar giriş yapın.");
    }

    throw new Error("Bu alana erişim yetkiniz bulunmamaktadır.");
  }

  redirect("/");
}

export async function getAuthenticatedUserOrThrow() {
  const { user } = await getAuthContext();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
