"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/utils/rate-limit"; // This is my existing rate limiter
import { headers } from "next/headers";

/**
 * Server Action to reveal a listing's phone number with security checks.
 * This prevents mass scraping by not including the phone number in the initial page payload.
 */
/**
 * Server Action to reveal a listing's phone number with security checks.
 * This prevents mass scraping by not including the phone number in the initial page payload.
 * Guests can reveal up to 5 numbers per hour, while logged-in users get more.
 */
export async function revealListingPhone(listingId: string) {
  const user = await getCurrentUser();
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";
  
  // High-Conversion Policy: Allow guests but limit them more strictly
  const identifier = user ? `reveal-phone:user:${user.id}` : `reveal-phone:ip:${ip}`;
  const limit = user ? 20 : 5; // Guests get 5, users get 20
  
  const rateLimit = await checkRateLimit(identifier, { limit, windowMs: 60 * 60 * 1000 });
  
  if (!rateLimit.allowed) {
    if (!user) {
      throw new Error("Çok fazla görüntüleme yaptınız. Daha fazlası için giriş yapın.");
    }
    throw new Error("Lütfen bir saat sonra tekrar deneyin.");
  }

  // Fetch only the phone number using admin client
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

