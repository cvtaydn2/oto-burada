"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/utils/rate-limit"; // This is my existing rate limiter
import { headers } from "next/headers";

/**
 * Server Action to reveal a listing's phone number with security checks.
 * This prevents mass scraping by not including the phone number in the initial page payload.
 */
export async function revealListingPhone(listingId: string) {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error("Bu işlemi gerçekleştirmek için giriş yapmalısınız.");
  }

  // Identity-based rate limiting (prevent one user from scraping many)
  const identifier = `reveal-phone:${user.id}`;
  const rateLimit = await checkRateLimit(identifier, { limit: 10, windowMs: 60 * 60 * 1000 }); // 10 reveals per hour
  
  if (!rateLimit.allowed) {
    throw new Error("Çok fazla görüntüleme yaptınız. Lütfen daha sonra tekrar deneyin.");
  }

  // Fetch only the phone number using admin client to ensure we get it even if RLS is tight,
  // but strictly controlled by this server-side logic.
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("listings")
    .select("whatsapp_phone")
    .eq("id", listingId)
    .single();

  if (error || !data) {
    throw new Error("İlan bulunamadı.");
  }

  return {
    phone: data.whatsapp_phone
  };
}
