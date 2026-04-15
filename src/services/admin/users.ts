"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { Profile } from "@/types/domain";
import { logger } from "@/lib/utils/logger";
import { captureServerError } from "@/lib/monitoring/posthog-server";

interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  // DB'de email_verified / phone_verified / identity_verified kolonları yok
  // is_verified tek doğrulama kolonu
  is_verified: boolean | null;
  role: string | null;
  user_type: string | null;
  balance_credits: number | null;
  tc_verified_at: string | null;
  eids_id: string | null;
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

  // Auth kullanıcılarını çek (son giriş için)
  const { data: authData } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  const authMap = Object.fromEntries(
    (authData?.users ?? []).map((u) => [u.id, u.last_sign_in_at ?? null])
  );

  let rpc = admin.from("profiles").select("*", { count: "exact" });

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

  const users = (profiles || []).map((p: ProfileRow) => ({
    id: p.id,
    fullName: p.full_name || "",
    phone: p.phone || "",
    city: p.city || "",
    avatarUrl: p.avatar_url,
    emailVerified: p.is_verified || false,
    phoneVerified: p.is_verified || false,
    identityVerified: p.is_verified || false,
    role: p.role || "user",
    userType: p.user_type || "individual",
    balanceCredits: p.balance_credits || 0,
    isVerified: p.is_verified || false,
    tcVerifiedAt: p.tc_verified_at,
    eidsId: p.eids_id,
    businessName: p.business_name,
    businessAddress: p.business_address,
    businessLogoUrl: p.business_logo_url,
    businessDescription: p.business_description,
    taxId: p.tax_id,
    taxOffice: p.tax_office,
    websiteUrl: p.website_url,
    verifiedBusiness: p.verified_business,
    businessSlug: p.business_slug,
    isBanned: p.is_banned,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    lastSignInAt: authMap[p.id] ?? null,
  })) as (Profile & { lastSignInAt: string | null })[];

  return { users, total: count ?? 0, page, limit };
}

export async function updateUserRole(userId: string, role: "user" | "admin" | "professional") {
  const supabase = await createSupabaseServerClient();
  
  const { error } = await supabase
    .from("profiles")
    .update({ role: role === "admin" ? "admin" : role === "professional" ? "professional" : "user" })
    .eq("id", userId);

  if (error) throw new Error(`Rol güncellenemedi: ${error.message}`);
  return { success: true };
}

export async function banUser(userId: string, reason: string) {
  const supabase = await createSupabaseServerClient();
  
  const { error } = await supabase
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
  const supabase = await createSupabaseServerClient();
  
  const { error } = await supabase
    .from("profiles")
    .update({ 
       verified_business: true 
    })
    .eq("id", userId);

  if (error) throw new Error(`İşletme doğrulanamadı: ${error.message}`);
  return { success: true };
}

// ─── Kullanıcı Detay & Ödeme Geçmişi ───────────────────────────────────────

export interface UserPaymentRecord {
  id: string;
  amount: number;
  provider: string;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface UserDopingRecord {
  listingId: string;
  listingTitle: string;
  dopingTypes: string[];
  appliedAt: string;
  featuredUntil: string | null;
  urgentUntil: string | null;
  highlightedUntil: string | null;
}

export interface UserDetailData {
  profile: ReturnType<typeof mapProfile>;
  payments: UserPaymentRecord[];
  dopings: UserDopingRecord[];
  listings: { id: string; title: string; status: string }[];
  listingCount: number;
  activeListingCount: number;
}

function mapProfile(p: ProfileRow) {
  return {
    id: p.id,
    fullName: p.full_name || "",
    phone: p.phone || "",
    city: p.city || "",
    avatarUrl: p.avatar_url,
    role: p.role || "user",
    userType: p.user_type || "individual",
    balanceCredits: p.balance_credits || 0,
    isVerified: p.is_verified || false,
    isBanned: p.is_banned || false,
    businessName: p.business_name,
    businessSlug: p.business_slug,
    verifiedBusiness: p.verified_business,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

export async function getUserDetail(userId: string): Promise<UserDetailData | null> {
  const supabase = await createSupabaseServerClient();

  const [
    { data: profile },
    { data: payments },
    { data: listings },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase
      .from("payments")
      .select("id, amount, provider, status, metadata, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("listings")
      .select("id, title, status, featured, featured_until, urgent_until, highlighted_until, created_at")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (!profile) return null;

  const dopings: UserDopingRecord[] = (listings || [])
    .filter((l) => l.featured || l.urgent_until || l.highlighted_until)
    .map((l) => ({
      listingId: l.id,
      listingTitle: l.title || l.id,
      dopingTypes: [
        l.featured ? "featured" : null,
        l.urgent_until ? "urgent" : null,
        l.highlighted_until ? "highlighted" : null,
      ].filter(Boolean) as string[],
      appliedAt: l.created_at,
      featuredUntil: l.featured_until,
      urgentUntil: l.urgent_until,
      highlightedUntil: l.highlighted_until,
    }));

  return {
    profile: mapProfile(profile as ProfileRow),
    payments: (payments || []) as UserPaymentRecord[],
    dopings,
    listings: (listings || []).map((l) => ({ id: l.id, title: l.title || l.id, status: l.status })),
    listingCount: (listings || []).length,
    activeListingCount: (listings || []).filter((l) => l.status === "approved").length,
  };
}

// ─── Hediye Kredi / Paket Tanımlama ─────────────────────────────────────────

export async function grantCreditsToUser(
  userId: string,
  credits: number,
  note: string,
  adminUserId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("balance_credits")
    .eq("id", userId)
    .single();

  const currentCredits = (profile?.balance_credits as number) || 0;

  const { error } = await supabase
    .from("profiles")
    .update({ balance_credits: currentCredits + credits })
    .eq("id", userId);

  if (error) {
    logger.admin.error("grantCreditsToUser failed", error, { userId, credits });
    return { success: false, error: error.message };
  }

  // Audit log
  const admin = createSupabaseAdminClient();
  await admin.from("admin_actions").insert({
    action: "approve",
    admin_user_id: adminUserId,
    note: `Hediye kredi: ${credits} kredi eklendi. Not: ${note}`,
    target_id: userId,
    target_type: "user",
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

// ─── Admin Doping Tanımlama ──────────────────────────────────────────────────

export async function grantDopingToListing(
  listingId: string,
  dopingTypes: string[],
  durationDays: number,
  adminUserId: string,
): Promise<{ success: boolean; error?: string }> {
  const admin = createSupabaseAdminClient();

  const until = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (dopingTypes.includes("featured")) {
    updates.featured = true;
    updates.featured_until = until;
  }
  if (dopingTypes.includes("urgent")) {
    updates.urgent_until = until;
  }
  if (dopingTypes.includes("highlighted")) {
    updates.highlighted_until = until;
  }

  const { error } = await admin.from("listings").update(updates).eq("id", listingId);

  if (error) {
    logger.admin.error("grantDopingToListing failed", error, { listingId });
    return { success: false, error: error.message };
  }

  await admin.from("admin_actions").insert({
    action: "approve",
    admin_user_id: adminUserId,
    note: `Hediye doping: ${dopingTypes.join(", ")} — ${durationDays} gün`,
    target_id: listingId,
    target_type: "listing",
  });

  revalidatePath("/admin/users");
  return { success: true };
}
