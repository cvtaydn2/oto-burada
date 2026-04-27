import type { User } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validators";
import type { Profile } from "@/types";

interface ProfileRow {
  avatar_url: string | null;
  business_address: string | null;
  business_description: string | null;
  business_logo_url: string | null;
  business_name: string | null;
  business_slug: string | null;
  city: string;
  created_at: string;
  is_banned: boolean | null;
  full_name: string;
  id: string;
  phone: string;
  role: Profile["role"];
  tax_id: string | null;
  tax_office: string | null;
  user_type: "individual" | "professional" | "staff";
  balance_credits: number;
  is_verified: boolean;
  updated_at: string;
  verified_business: boolean | null;
  website_url: string | null;
  verification_status: Profile["verificationStatus"];
  verification_requested_at: string | null;
  verification_feedback: string | null;
}

function getVerificationState(user: User | null | undefined) {
  const appMetadata = (user?.app_metadata as
    | {
        email_verified?: boolean;
        identity_verified?: boolean;
        phone_verified?: boolean;
      }
    | undefined) ?? {
    email_verified: false,
    identity_verified: false,
    phone_verified: false,
  };

  return {
    emailVerified: Boolean(
      appMetadata.email_verified ?? user?.email_confirmed_at ?? user?.confirmed_at
    ),
  };
}

function mapProfileRow(row: ProfileRow, authUser?: User | null): Profile {
  const verificationState = getVerificationState(authUser);
  const parsed = profileSchema.safeParse({
    avatarUrl: row.avatar_url,
    city: row.city || "",
    createdAt: row.created_at,
    emailVerified: verificationState.emailVerified,
    fullName: row.full_name,
    id: row.id,
    isVerified: row.is_verified,
    isBanned: row.is_banned ?? false,
    businessName: row.business_name,
    businessAddress: row.business_address,
    businessLogoUrl: row.business_logo_url,
    businessDescription: row.business_description,
    taxId: row.tax_id,
    taxOffice: row.tax_office,
    websiteUrl: row.website_url,
    verifiedBusiness: row.verified_business ?? false,
    businessSlug: row.business_slug,
    verificationStatus: row.verification_status || "none",
    verificationRequestedAt: row.verification_requested_at,
    verificationFeedback: row.verification_feedback,
    balanceCredits: row.balance_credits || 0,
    updatedAt: row.updated_at,
  });

  if (parsed.success) {
    return parsed.data;
  }

  // Fallback object must strictly follow profileSchema shape for reliable type inference
  return {
    id: row.id,
    fullName: row.full_name || "Kullanıcı",
    phone: row.phone || "",
    city: row.city || "",
    avatarUrl: row.avatar_url,
    emailVerified: verificationState.emailVerified,
    role: row.role || "user",
    isVerified: row.is_verified ?? false,
    isBanned: row.is_banned ?? false,
    businessName: row.business_name,
    businessAddress: row.business_address,
    businessLogoUrl: row.business_logo_url,
    businessDescription: row.business_description,
    taxId: row.tax_id,
    taxOffice: row.tax_office,
    websiteUrl: row.website_url,
    verifiedBusiness: row.verified_business ?? false,
    businessSlug: row.business_slug,
    verificationStatus: (row.verification_status as Profile["verificationStatus"]) || "none",
    verificationRequestedAt: row.verification_requested_at,
    verificationFeedback: row.verification_feedback,
    balanceCredits: row.balance_credits || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Builds a profile object from auth user metadata.
 * Does NOT perform any database operations.
 * Use this for read-only profile construction from auth context.
 *
 * For profile bootstrap/creation, use a dedicated auth callback or onboarding flow.
 *
 * SECURITY: Role is ONLY resolved from app_metadata (trusted, server-controlled).
 * user_metadata.role is IGNORED to prevent privilege escalation.
 */
export function buildProfileFromAuthUser(user: User): Profile {
  const userMetadata = user.user_metadata as {
    avatar_url?: string;
    business_address?: string;
    business_description?: string;
    business_logo_url?: string;
    business_name?: string;
    business_slug?: string;
    city?: string;
    full_name?: string;
    phone?: string;
    tax_id?: string;
    tax_office?: string;
    website_url?: string;
  };
  const appMetadata = user.app_metadata as {
    identity_verified?: boolean;
    role?: string;
    verified_business?: boolean;
  };
  const verificationState = getVerificationState(user);
  const timestamp = new Date().toISOString();

  // SECURITY: Role ONLY from app_metadata (trusted source)
  // user_metadata.role is NEVER used (user-writable, untrusted)
  const resolvedRole = appMetadata.role === "admin" ? "admin" : "user";

  const rawProfile = {
    avatarUrl: userMetadata.avatar_url ?? null,
    id: user.id,
    fullName: userMetadata.full_name ?? "",
    phone: userMetadata.phone ?? "",
    city: userMetadata.city ?? "",
    emailVerified: verificationState.emailVerified,
    isVerified: false,
    role: resolvedRole as Profile["role"],
    userType: "individual" as const,
    balanceCredits: 0,
    isBanned: false,
    businessName: userMetadata.business_name ?? null,
    businessAddress: userMetadata.business_address ?? null,
    businessLogoUrl: userMetadata.business_logo_url ?? null,
    businessDescription: userMetadata.business_description ?? null,
    taxId: userMetadata.tax_id ?? null,
    taxOffice: userMetadata.tax_office ?? null,
    websiteUrl: userMetadata.website_url ?? null,
    verifiedBusiness: appMetadata.verified_business === true,
    businessSlug: userMetadata.business_slug ?? null,
    verificationStatus: "none" as const,
    createdAt: user.created_at ?? timestamp,
    updatedAt: timestamp,
  };

  try {
    return profileSchema.parse(rawProfile);
  } catch {
    return {
      ...rawProfile,
      fullName: "Kullanıcı",
      phone: "",
      city: "",
      isVerified: false,
    };
  }
}

/**
 * REMOVED: This function was deprecated due to side-effects during read operations.
 *
 * Use instead:
 * - buildProfileFromAuthUser() for read-only profile construction
 * - createOrUpdateProfile() for explicit profile creation (auth callbacks, onboarding)
 *
 * @deprecated Removed in P1 security hardening (2026-04-19)
 */
// export async function ensureProfileRecord(user: User) - REMOVED

/**
 * Creates or updates a profile record in the database.
 * Use this for explicit profile mutations (onboarding, auth callbacks, profile updates).
 *
 * This is the proper way to bootstrap user profiles.
 */
export async function createOrUpdateProfile(user: User) {
  const profile = buildProfileFromAuthUser(user);

  if (!hasSupabaseAdminEnv()) {
    return profile;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("profiles").upsert(
    {
      avatar_url: profile.avatarUrl,
      city: profile.city,
      full_name: profile.fullName,
      id: profile.id,
      phone: profile.phone,
      role: profile.role,
      user_type: profile.userType ?? "individual",
      balance_credits: profile.balanceCredits ?? 0,
      is_verified: profile.isVerified ?? false,
      is_banned: profile.isBanned ?? false,
      business_name: profile.businessName ?? null,
      business_address: profile.businessAddress ?? null,
      business_logo_url: profile.businessLogoUrl ?? null,
      business_description: profile.businessDescription ?? null,
      tax_id: profile.taxId ?? null,
      tax_office: profile.taxOffice ?? null,
      website_url: profile.websiteUrl ?? null,
      verified_business: profile.verifiedBusiness ?? false,
      business_slug: profile.businessSlug ?? null,
      updated_at: profile.updatedAt,
    },
    { onConflict: "id" }
  );

  if (error) {
    throw new Error(`Failed to create/update profile: ${error.message}`);
  }

  return profile;
}

/**
 * Get profile by ID (admin-only operation).
 * Uses admin client to bypass RLS for admin dashboard operations.
 *
 * For user-scoped profile reads, use getUserProfile() instead.
 */
export async function getStoredProfileById(profileId: string) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select(
      "id, full_name, phone, city, avatar_url, role, user_type, balance_credits, is_verified, is_banned, business_name, business_address, business_logo_url, business_description, tax_id, tax_office, website_url, verified_business, business_slug, verification_status, verification_requested_at, verification_feedback, created_at, updated_at"
    )
    .eq("id", profileId)
    .maybeSingle<ProfileRow>();

  if (!error && data) {
    const {
      data: { user },
    } = await admin.auth.admin.getUserById(profileId);

    return mapProfileRow(data, user);
  }

  return null;
}

/**
 * Get current user's profile (user-scoped operation).
 * Uses server client with RLS enforcement.
 * RLS policy ensures user can only read their own profile.
 *
 * SECURITY: This is the preferred method for user profile reads.
 */
export async function getUserProfile(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, phone, city, avatar_url, role, user_type, balance_credits, is_verified, is_banned, business_name, business_address, business_logo_url, business_description, tax_id, tax_office, website_url, verified_business, business_slug, verification_status, verification_requested_at, verification_feedback, created_at, updated_at"
    )
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (!error && data) {
    // Get auth user for verification state
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return mapProfileRow(data, user);
  }

  return null;
}

/**
 * Update profile (admin-only operation).
 * Uses admin client to bypass RLS for admin dashboard operations.
 *
 * For user-scoped profile updates, use updateUserProfile() instead.
 */
export async function updateProfileTable(
  userId: string,
  data: {
    fullName: string;
    phone: string;
    city: string;
    avatarUrl?: string | null;
  }
) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      avatar_url: data.avatarUrl ?? null,
      city: data.city,
      full_name: data.fullName,
      phone: data.phone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    return null;
  }

  return getStoredProfileById(userId);
}

/**
 * Update current user's profile (user-scoped operation).
 * Uses server client with RLS enforcement.
 * RLS policy ensures user can only update their own profile.
 *
 * SECURITY: This is the preferred method for user profile updates.
 */
export async function updateUserProfile(
  userId: string,
  data: {
    fullName: string;
    phone: string;
    city: string;
    avatarUrl?: string | null;
  }
) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      avatar_url: data.avatarUrl ?? null,
      city: data.city,
      full_name: data.fullName,
      phone: data.phone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    return null;
  }

  return getUserProfile(userId);
}

/**
 * Checks if a user is banned.
 * Used in API routes before allowing mutations (listing creation, messaging, etc.)
 *
 * SECURITY: Fail-closed behavior in production.
 * - If DB is unavailable in production → throws error (blocks operation)
 * - If DB is unavailable in development → returns false (allows operation for dev convenience)
 * - If user record not found → returns false (user not banned)
 * - If is_banned is true → returns true (user is banned)
 *
 * @throws Error in production if database is unavailable
 */
export async function isUserBanned(userId: string): Promise<boolean> {
  if (!hasSupabaseAdminEnv()) {
    // Fail-closed in production, fail-open in development
    if (process.env.NODE_ENV === "production") {
      throw new Error("Database unavailable - cannot verify ban status");
    }
    return false; // Development: allow operation
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("is_banned")
    .eq("id", userId)
    .maybeSingle<{ is_banned: boolean | null }>();

  if (error) {
    // Database error in production should block the operation
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Failed to check ban status: ${error.message}`);
    }
    return false; // Development: allow operation
  }

  if (!data) {
    // User record not found - not banned
    return false;
  }

  return data.is_banned === true;
}

/**
 * LIGHTWEIGHT PERFORMANCE OPTIMIZATION:
 * Checks if a user is banned with minimal column selection.
 * AGENTS.md: Avoid SELECT * in hot paths.
 */
export async function isUserBannedLight(userId: string): Promise<boolean> {
  if (!hasSupabaseAdminEnv()) return false;

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("is_banned")
    .eq("id", userId)
    .maybeSingle<{ is_banned: boolean }>();

  return data?.is_banned ?? false;
}

/**
 * LIGHTWEIGHT PERFORMANCE OPTIMIZATION:
 * Gets user role with minimal column selection.
 */
export async function getUserRoleLight(userId: string): Promise<Profile["role"]> {
  if (!hasSupabaseAdminEnv()) return "user";

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<{ role: Profile["role"] }>();

  return data?.role ?? "user";
}

/**
 * Seller triggers verification request.
 * Moves state to 'pending' and stores timestamp.
 */
export async function requestVerification(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();

  // 1. Check current status
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("verification_status, is_banned")
    .eq("id", userId)
    .single();

  if (fetchError || !profile) {
    return { success: false, error: "Profil bulunamadı." };
  }

  if (profile.is_banned) {
    return { success: false, error: "Kısıtlanmış kullanıcılar onay talebinde bulunamaz." };
  }

  if (profile.verification_status === "pending") {
    return { success: false, error: "Zaten bekleyen bir onay talebiniz bulunmaktadır." };
  }

  if (profile.verification_status === "approved") {
    return { success: false, error: "Hesabınız zaten onaylıdır." };
  }

  // 2. Cooldown check: prevent spam if rejected less than 24h ago
  if (profile.verification_status === "rejected") {
    const { data: lastAction } = await supabase
      .from("admin_actions")
      .select("created_at")
      .eq("target_id", userId)
      .eq("action", "reject")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (lastAction) {
      const lastUpdate = new Date(lastAction.created_at).getTime();
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (now - lastUpdate < twentyFourHours) {
        return {
          success: false,
          error: "Ret kararından sonra tekrar başvurmak için 24 saat beklemeniz gerekmektedir.",
        };
      }
    }
  }

  // 3. Update to pending
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      verification_status: "pending",
      verification_requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

/**
 * Fetches a seller's public profile for marketplace display.
 *
 * Only returns fields safe for public consumption — no sensitive data.
 * Uses admin client to bypass RLS (public read, no auth required).
 */
export async function getPublicSellerProfile(sellerId: string): Promise<Profile | null> {
  if (!hasSupabaseAdminEnv()) return null;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select(
      `id, full_name, phone, city, avatar_url, role, user_type,
       balance_credits, is_verified, is_banned, ban_reason,
       business_name, business_logo_url, business_slug, business_description,
       website_url, verified_business, verification_status,
       trust_score, created_at, updated_at`
    )
    .eq("id", sellerId)
    .maybeSingle();

  if (error || !data) return null;

  // SECURITY: Mask phone number for public display.
  // Raw phone is only available via revealListingPhone action.
  const maskedPhone = data.phone
    ? data.phone.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, "$1*** ** $4")
    : "";

  return {
    id: data.id,
    fullName: data.full_name,
    phone: maskedPhone,
    city: data.city,
    avatarUrl: data.avatar_url,
    emailVerified: false,
    isVerified: data.is_verified,
    role: data.role as Profile["role"],
    userType: data.user_type as Profile["userType"],
    balanceCredits: data.balance_credits ?? 0,
    businessName: data.business_name,
    businessLogoUrl: data.business_logo_url,
    businessSlug: data.business_slug,
    businessDescription: data.business_description,
    websiteUrl: data.website_url,
    verificationStatus: data.verification_status as Profile["verificationStatus"],
    trustScore: data.trust_score ?? 0,
    isBanned: data.is_banned,
    banReason: data.ban_reason,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  } satisfies Profile;
}
