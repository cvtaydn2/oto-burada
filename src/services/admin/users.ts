"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { Profile } from "@/types/domain";
import { logger } from "@/lib/utils/logger";
import { captureServerError } from "@/lib/monitoring/posthog-server";

// Re-exports
export * from "./user-details";
export * from "./user-actions";

interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  role: string | null;
  user_type: string | null;
  balance_credits: number | null;
  business_name: string | null;
  business_address: string | null;
  business_logo_url: string | null;
  business_description: string | null;
  tax_id: string | null;
  tax_office: string | null;
  website_url: string | null;
  verified_business: boolean | null;
  business_slug: string | null;
  is_banned: boolean | null;
  created_at: string;
  updated_at: string;
}

export async function getAllUsers(query?: string, page = 1, limit = 20) {
  const admin = createSupabaseAdminClient();

  const { data: authData } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  const authMap = Object.fromEntries(
    (authData?.users ?? []).map((u) => [
      u.id,
      {
        lastSignInAt: u.last_sign_in_at ?? null,
        emailVerified: Boolean(u.email_confirmed_at ?? u.confirmed_at),
        phoneVerified: Boolean((u as { phone_confirmed_at?: string | null }).phone_confirmed_at),
        identityVerified: Boolean((u.app_metadata as { identity_verified?: boolean } | undefined)?.identity_verified),
      },
    ])
  );

  let rpc = admin.from("profiles").select(
    "id, full_name, phone, city, avatar_url, role, user_type, balance_credits, is_verified, is_banned, business_name, business_logo_url, business_slug, verified_business, created_at, updated_at",
    { count: "exact" }
  );

  if (query) {
    rpc = rpc.or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,id.ilike.%${query}%`);
  }

  const from = (page - 1) * limit;
  const { data: profiles, error, count } = await rpc
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (error) {
    logger.admin.error("getAllUsers query failed", error, { query });
    captureServerError("getAllUsers query failed", "admin", error, { query });
    return { users: [] as Profile[], total: 0, page, limit };
  }

  type UserListRow = Pick<ProfileRow,
    "id" | "full_name" | "phone" | "city" | "avatar_url" | "role" | "user_type" |
    "balance_credits" | "is_verified" | "is_banned" |
    "business_name" | "business_logo_url" | "business_slug" | "verified_business" |
    "created_at" | "updated_at"
  >;

  const users = (profiles || []).map((p: UserListRow) => {
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
      verifiedBusiness: p.verified_business,
      businessSlug: p.business_slug,
      isBanned: p.is_banned,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      lastSignInAt: auth?.lastSignInAt ?? null,
    } as Profile & { lastSignInAt: string | null };
  });

  return { users, total: count ?? 0, page, limit };
}

export async function updateUserRole(userId: string, role: "user" | "admin" | "professional") {
  const admin = createSupabaseAdminClient();
  const nextRole = role === "admin" ? "admin" : "user";
  const nextUserType = role === "professional" ? "professional" : "individual";

  const { error } = await admin
    .from("profiles")
    .update({
      role: nextRole,
      user_type: nextUserType,
    })
    .eq("id", userId);

  if (error) throw new Error(`Rol güncellenemedi: ${error.message}`);

  if (role === "admin") {
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { role: "admin" },
    });
  } else {
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { role: "user" },
    });
  }

  return { success: true };
}

export async function banUser(userId: string, reason: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ 
       is_banned: true,
       ban_reason: reason 
    })
    .eq("id", userId);

  if (error) throw new Error(`Kullanıcı engellenemedi: ${error.message}`);
  revalidatePath("/admin/users");
  return { success: true };
}

export async function verifyUserBusiness(userId: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ 
       verified_business: true 
    })
    .eq("id", userId);

  if (error) throw new Error(`İşletme doğrulanamadı: ${error.message}`);
  return { success: true };
}
