"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { headers } from "next/headers";
import { captureServerEvent } from "@/lib/monitoring/posthog-server";

/**
 * Server Action to reveal a listing's phone number.
 * Requires authentication — guests cannot reveal phone numbers.
 * Authenticated users: 20 reveals per hour.
 */
export async function revealListingPhone(listingId: string) {
  const user = await getCurrentUser();

  // Telefon numarası görmek için giriş zorunlu
  if (!user) {
    throw new Error("Telefon numarasını görmek için giriş yapmalısınız.");
  }

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";

  const rateLimit = await checkRateLimit(
    `reveal-phone:user:${user.id}`,
    { limit: 20, windowMs: 60 * 60 * 1000 },
  );

  if (!rateLimit.allowed) {
    throw new Error("Lütfen bir saat sonra tekrar deneyin.");
  }

  // Fetch listing and seller trust status
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("listings")
    .select(`
      whatsapp_phone, 
      status, 
      seller_id,
      profiles!seller_id (
        is_banned,
        ban_reason
      )
    `)
    .eq("id", listingId)
    .single();

  if (error || !data) {
    throw new Error("İlan bulunamadı.");
  }

  // CRITICAL: Block leads for restricted or risky sellers
  const sellerProfile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  const isSellerBanned = sellerProfile?.is_banned || false;
  
  if (isSellerBanned) {
    throw new Error("Satıcı hesabı inceleme altında. Şu an iletişim kurulamıyor.");
  }

  // Only allow phone reveal for approved listings
  if (data.status !== "approved") {
    throw new Error("Bu ilan aktif değil. Telefon numarası gösterilemiyor.");
  }

  captureServerEvent("contact_phone_revealed_server", {
    listingId,
    userId: user?.id ?? "guest",
    isGuest: !user,
    sellerId: data.seller_id,
  });

  // Persist to phone_reveal_logs for scraping detection and seller analytics.
  // Fire-and-forget — never blocks the phone reveal response.
  // Requires: scripts/migrations/add-phone-reveal-logs.sql to be applied.
  void admin.from("phone_reveal_logs").insert({
    listing_id: listingId,
    user_id: user.id,
    viewer_ip: ip !== "unknown" ? ip : null,
  });

  return {
    phone: data.whatsapp_phone,
  };
}

