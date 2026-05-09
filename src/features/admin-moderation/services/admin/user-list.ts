"use server";

import { logger } from "@/lib/logger";
import { captureServerError } from "@/lib/telemetry-server";
import { Profile } from "@/types";

import { AuthUserResponse, constructAuthMap, sanitizeUserSearchQuery } from "./user-pure-logic";
import { fetchBatchAuthUsers, fetchUsersProfiles } from "./user-records";

export async function getAllUsers(query?: string, page = 1, limit = 20) {
  const sanitizedQuery = sanitizeUserSearchQuery(query);
  const from = (page - 1) * limit;

  const { data: profiles, error, count } = await fetchUsersProfiles(sanitizedQuery, from, limit);

  if (error || !profiles) {
    if (error) {
      logger.admin.error("getAllUsers query failed", error, { query });
      captureServerError("getAllUsers query failed", "admin", error, { query });
    }
    return { users: [] as Profile[], total: 0, page, limit };
  }

  // 2. Targeted Auth Fetch (Only for current page IDs)
  // Use sequential chunks of 5 to avoid Free-Tier Auth API rate limits
  const profileIds = profiles.map((p) => p.id);
  const authResults: AuthUserResponse[] = [];
  const CHUNK_SIZE = 5;

  for (let i = 0; i < profileIds.length; i += CHUNK_SIZE) {
    const chunk = profileIds.slice(i, i + CHUNK_SIZE);
    const results = await fetchBatchAuthUsers(chunk);
    authResults.push(...(results as AuthUserResponse[]));
  }

  const authMap = constructAuthMap(authResults);

  const users = (profiles || []).map((p) => {
    const auth = authMap[p.id];
    return {
      id: p.id,
      fullName: p.full_name || "",
      phone: p.phone || "",
      city: p.city || "",
      avatarUrl: p.avatar_url,
      emailVerified: auth?.emailVerified ?? p.is_verified ?? false,
      phoneVerified: auth?.phoneVerified ?? false,
      identityVerified: auth?.identityVerified ?? p.is_verified ?? false,
      role: p.role || "user",
      userType: p.user_type || "individual",
      balanceCredits: p.balance_credits || 0,
      isVerified: p.is_verified || false,
      businessName: p.business_name,
      businessAddress: null,
      businessLogoUrl: p.business_logo_url,
      businessDescription: null,
      taxId: null,
      taxOffice: null,
      websiteUrl: null,
      businessSlug: p.business_slug,
      isBanned: p.is_banned,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      lastSignInAt: auth?.lastSignInAt ?? null,
    } as Profile & { lastSignInAt: string | null };
  });

  return { users, total: count ?? 0, page, limit };
}
