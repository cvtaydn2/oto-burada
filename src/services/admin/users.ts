"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Profile } from "@/types/domain";

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
    console.error("Error fetching all users:", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (profiles || []).map((p: any) => ({
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
