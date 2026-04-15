import type { User } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
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
  tc_verified_at: string | null;
  eids_id: string | null;
  updated_at: string;
  verified_business: boolean | null;
  website_url: string | null;
}

function getVerificationState(user: User | null | undefined) {
  const appMetadata = (user?.app_metadata as {
    email_verified?: boolean;
    identity_verified?: boolean;
    phone_verified?: boolean;
  } | undefined) ?? {
    email_verified: false,
    identity_verified: false,
    phone_verified: false,
  };
  const authUser = user as (User & { phone_confirmed_at?: string | null }) | null | undefined;

  return {
    emailVerified: Boolean(appMetadata.email_verified ?? user?.email_confirmed_at ?? user?.confirmed_at),
    identityVerified: appMetadata.identity_verified === true,
    phoneVerified: Boolean(appMetadata.phone_verified ?? authUser?.phone_confirmed_at),
  };
}

function mapProfileRow(row: ProfileRow, authUser?: User | null) {
  const verificationState = getVerificationState(authUser);
  const parsed = profileSchema.safeParse({
    avatarUrl: row.avatar_url,
    city: row.city || "",
    createdAt: row.created_at,
    emailVerified: verificationState.emailVerified,
    fullName: row.full_name,
    id: row.id,
    identityVerified: verificationState.identityVerified,
    phone: row.phone,
    phoneVerified: verificationState.phoneVerified,
    role: row.role,
    userType: row.user_type,
    balanceCredits: row.balance_credits,
    isVerified: row.is_verified,
    isBanned: row.is_banned ?? false,
    tcVerifiedAt: row.tc_verified_at,
    eidsId: row.eids_id,
    businessName: row.business_name,
    businessAddress: row.business_address,
    businessLogoUrl: row.business_logo_url,
    businessDescription: row.business_description,
    taxId: row.tax_id,
    taxOffice: row.tax_office,
    websiteUrl: row.website_url,
    verifiedBusiness: row.verified_business ?? false,
    businessSlug: row.business_slug,
    updatedAt: row.updated_at,
  });

  if (parsed.success) {
    return parsed.data;
  }

  return {
    id: row.id,
    fullName: row.full_name || "Kullanıcı",
    phone: row.phone || "",
    city: "",
    avatarUrl: row.avatar_url,
    emailVerified: verificationState.emailVerified,
    role: row.role || "user",
    identityVerified: verificationState.identityVerified,
      phoneVerified: verificationState.phoneVerified,
      userType: row.user_type || "individual",
      balanceCredits: row.balance_credits || 0,
      isVerified: row.is_verified || false,
      isBanned: row.is_banned || false,
      tcVerifiedAt: row.tc_verified_at,
      eidsId: row.eids_id,
      businessName: row.business_name,
      businessAddress: row.business_address,
      businessLogoUrl: row.business_logo_url,
      businessDescription: row.business_description,
      taxId: row.tax_id,
      taxOffice: row.tax_office,
      websiteUrl: row.website_url,
      verifiedBusiness: row.verified_business || false,
      businessSlug: row.business_slug,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
}

export function buildProfileFromAuthUser(user: User) {
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
    role?: string;
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
  const resolvedRole =
    appMetadata.role === "admin" || userMetadata.role === "admin" ? "admin" : "user";

  const rawProfile = {
    avatarUrl: userMetadata.avatar_url ?? null,
    id: user.id,
    fullName: userMetadata.full_name ?? "",
    phone: userMetadata.phone ?? "",
    city: userMetadata.city ?? "",
    emailVerified: verificationState.emailVerified,
    phoneVerified: verificationState.phoneVerified,
    identityVerified: verificationState.identityVerified,
    isVerified: verificationState.identityVerified, // Default to matching identity verification
    role: resolvedRole as Profile["role"],
    userType: "individual" as const,
    balanceCredits: 0,
    tcVerifiedAt: null,
    eidsId: null,
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

export async function ensureProfileRecord(user: User) {
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
    { onConflict: "id" },
  );

  if (error) {
    return profile;
  }

  return profile;
}

export async function getStoredProfileById(profileId: string) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name, phone, city, avatar_url, role, user_type, balance_credits, is_verified, is_banned, tc_verified_at, eids_id, business_name, business_address, business_logo_url, business_description, tax_id, tax_office, website_url, verified_business, business_slug, created_at, updated_at")
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

export async function updateProfileTable(
  userId: string,
  data: {
    fullName: string;
    phone: string;
    city: string;
    avatarUrl?: string | null;
  },
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
 * Marks a profile as identity verified (EИDS/Mock E-Devlet).
 */
export async function verifyProfileIdentity(userId: string, eidsId: string) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      is_verified: true,
      tc_verified_at: new Date().toISOString(),
      eids_id: eidsId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    return null;
  }

  // Also update auth user metadata for convenience in sessions
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { identity_verified: true },
  });

  return getStoredProfileById(userId);
}
