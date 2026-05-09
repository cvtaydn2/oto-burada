import type { PostgrestError } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/admin";
import type { Database } from "@/types/supabase";

/**
 * Low-level direct database queries for User administration.
 */

export async function fetchUsersProfiles(sanitizedQuery: string, from: number, limit: number) {
  const admin = createSupabaseAdminClient();
  let rpc = admin
    .from("profiles")
    .select(
      "id, full_name, phone, city, avatar_url, role, user_type, balance_credits, is_verified, is_banned, business_name, business_logo_url, business_slug, verified_business, created_at, updated_at",
      { count: "exact" }
    );

  if (sanitizedQuery.length > 0) {
    rpc = rpc.or(
      `full_name.ilike.%${sanitizedQuery}%,phone.ilike.%${sanitizedQuery}%,id::text.ilike.%${sanitizedQuery}%`
    );
  }

  return rpc.order("created_at", { ascending: false }).range(from, from + limit - 1);
}

export async function fetchAuthUserById(userId: string) {
  const admin = createSupabaseAdminClient();
  return admin.auth.admin.getUserById(userId);
}

export async function fetchBatchAuthUsers(ids: string[]) {
  const admin = createSupabaseAdminClient();
  const results = await Promise.all(ids.map((id) => admin.auth.admin.getUserById(id)));
  return results;
}

export async function fetchUserDetailsComposite(userId: string) {
  const admin = createSupabaseAdminClient();

  return Promise.all([
    admin.auth.admin.getUserById(userId),
    admin
      .from("profiles")
      .select(
        "id, full_name, phone, city, avatar_url, role, user_type, balance_credits, is_verified, is_banned, ban_reason, identity_number, business_name, business_address, business_logo_url, business_description, tax_id, tax_office, website_url, verified_business, business_slug, created_at, updated_at, trust_score, verification_status, email_verified"
      )
      .eq("id", userId)
      .single(),
    admin
      .from("payments")
      .select("id, amount, provider, status, metadata, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("listings")
      .select(
        "id, slug, title, brand, model, status, featured, featured_until, urgent_until, highlighted_until, created_at"
      )
      .eq("seller_id", userId)
      .order("created_at", { ascending: false }),
    admin
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("doping_applications")
      .select("*, listings(title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
}

export async function atomicBanUser(userId: string, isBanning: boolean) {
  const admin = createSupabaseAdminClient();
  return admin.rpc("ban_user_atomic", {
    p_user_id: userId,
    p_reason: isBanning ? "Admin tarafından yasaklandı" : "",
    p_preserve_metadata: true,
  });
}

export async function updateAuthAppMetadata(userId: string, metadata: Record<string, unknown>) {
  const admin = createSupabaseAdminClient();
  return admin.auth.admin.updateUserById(userId, {
    app_metadata: metadata,
  });
}

export async function getProfileById(
  userId: string,
  select: string = "id"
): Promise<{ data: unknown; error: PostgrestError | null }> {
  const admin = createSupabaseAdminClient();
  const result = await admin.from("profiles").select(select).eq("id", userId).single();
  return result;
}

export async function updateProfile(
  userId: string,
  data: Database["public"]["Tables"]["profiles"]["Update"]
) {
  const admin = createSupabaseAdminClient();
  return admin.from("profiles").update(data).eq("id", userId);
}

export async function deleteAuthUser(userId: string) {
  const admin = createSupabaseAdminClient();
  return admin.auth.admin.deleteUser(userId);
}

export async function atomicAdjustCredits(userId: string, credits: number, description: string) {
  const admin = createSupabaseAdminClient();
  return admin.rpc("adjust_user_credits_atomic", {
    p_user_id: userId,
    p_amount: credits,
    p_type: "admin_grant",
    p_description: description,
    p_reference_id: `Admin:${userId}`,
  });
}

export async function insertDopingGrant(
  listingId: string,
  dopingType: string,
  durationDays: number
) {
  const admin = createSupabaseAdminClient();
  return admin.from("listing_dopings").insert({
    listing_id: listingId,
    doping_type: dopingType,
    started_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  });
}
