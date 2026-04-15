"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
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
  email_verified: boolean | null;
  phone_verified: boolean | null;
  identity_verified: boolean | null;
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

export async function getAllUsers(query?: string) {
  const supabase = await createSupabaseServerClient();
  
  let rpc = supabase
    .from("profiles")
    .select("*");

  if (query) {
    rpc = rpc.or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,id.ilike.%${query}%`);
  }

  const { data: profiles, error } = await rpc
    .order("created_at", { ascending: false });

  if (error) {
    logger.admin.error("getAllUsers query failed", error, { query });
    captureServerError("getAllUsers query failed", "admin", error, { query });
    return [];
  }

  return (profiles || []).map((p: ProfileRow) => ({
    id: p.id,
    fullName: p.full_name || "",
    phone: p.phone || "",
    city: p.city || "",
    avatarUrl: p.avatar_url,
    emailVerified: p.email_verified || false,
    phoneVerified: p.phone_verified || false,
    identityVerified: p.identity_verified || p.is_verified || false,
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
  })) as Profile[];
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
