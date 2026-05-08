"use server";

import { revalidatePath } from "next/cache";

import { archiveListingUseCase } from "@/domain/usecases/listing-archive";
import { bumpListingUseCase } from "@/domain/usecases/listing-bump";
import { publishListingUseCase } from "@/domain/usecases/listing-publish";
import { getCurrentUser } from "@/features/auth/lib/session";
import { createSupabaseServerClient } from "@/lib/server";
import { ListingStatus } from "@/types";

export async function archiveListingAction(listingId: string, currentStatus: ListingStatus) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const result = await archiveListingUseCase(listingId, user.id, currentStatus);

  if (result.success) {
    revalidatePath("/dashboard/listings");
    revalidatePath(`/listing/${result.listing?.slug}`);
  }

  return result;
}

export async function bumpListingAction(
  listingId: string,
  listing: { status: ListingStatus; bumpedAt?: string | null }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const result = await bumpListingUseCase(listingId, user.id, listing);

  if (result.success) {
    revalidatePath("/dashboard/listings");
  }

  return result;
}

export async function revealListingPhone(listingId: string) {
  const user = await getCurrentUser();
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const clientIp =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown";

  // ── Distributed Rate Limit (F-03 Protection) ──
  const { checkGlobalRateLimit } = await import("@/lib/distributed-rate-limit");

  // Combined IP + UserID protection: prevents bypassing by switching IPs or accounts
  const limit = user ? 20 : 5;
  const windowMs = 60 * 60 * 1000; // 1 hour
  const rateLimitKey = user
    ? `reveal-phone:ip:${clientIp}:u:${user.id}`
    : `reveal-phone:ip:${clientIp}:guest`;

  const rateLimitResult = await checkGlobalRateLimit(rateLimitKey, {
    limit,
    windowMs,
  });

  if (!rateLimitResult.success) {
    throw new Error(
      user
        ? "Çok fazla numara görüntülediniz. Lütfen bir saat sonra tekrar deneyin."
        : "Çok fazla numara görüntülediniz. Devam etmek için lütfen giriş yapın."
    );
  }

  const { createSupabaseAdminClient } = await import("@/lib/admin");
  const admin = createSupabaseAdminClient();

  // Fetch phone and verify status
  const { data: listing, error: fetchErr } = await admin
    .from("listings")
    .select(
      `
      whatsapp_phone,
      status,
      seller:profiles!listings_seller_id_fkey(is_banned)
    `
    )
    .eq("id", listingId)
    .single();

  const seller = Array.isArray(listing?.seller) ? listing.seller[0] : listing?.seller;

  if (fetchErr || !listing || listing.status !== "approved" || seller?.is_banned === true) {
    throw new Error("İlan bulunamadı veya iletişim bilgileri kapalı.");
  }

  // ── Reveal Logging (Audit Trail) ──
  const { error: logError } = await admin.from("phone_reveal_logs").insert({
    listing_id: listingId,
    user_id: user?.id || null,
    viewer_ip: clientIp,
  });

  if (logError) {
    console.error("Failed to log phone reveal", logError);
  }

  return { success: true, phone: listing.whatsapp_phone };
}

export async function publishListingAction(listingId: string, currentStatus: ListingStatus) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const result = await publishListingUseCase(listingId, user.id, currentStatus);

  if (result.success) {
    revalidatePath("/dashboard/listings");
    revalidatePath(`/listing/${result.listing?.slug}`);
  }

  return result;
}

async function getOwnedListingIds(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  ids: string[],
  sellerId: string
) {
  const { data, error } = await supabase
    .from("listings")
    .select("id")
    .in("id", ids)
    .eq("seller_id", sellerId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => row.id);
}

export async function bulkArchiveListingAction(ids: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await createSupabaseServerClient();
  const ownedIds = await getOwnedListingIds(supabase, ids, user.id);

  if (ownedIds.length === 0) {
    return { success: true, count: 0 };
  }

  const { error, data } = await supabase
    .from("listings")
    .update({
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .in("id", ownedIds)
    .eq("seller_id", user.id)
    .select("id");

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/listings");
  return { success: true, count: data?.length ?? 0 };
}

export async function bulkDeleteListingAction(ids: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await createSupabaseServerClient();
  const ownedIds = await getOwnedListingIds(supabase, ids, user.id);

  if (ownedIds.length === 0) {
    return { success: true, count: 0 };
  }

  // 1. Delete associated data (only for caller-owned listings)
  await supabase.from("listing_images").delete().in("listing_id", ownedIds);
  await supabase.from("favorites").delete().in("listing_id", ownedIds);

  // 2. Delete listings
  const { error, data } = await supabase
    .from("listings")
    .delete()
    .in("id", ownedIds)
    .eq("seller_id", user.id)
    .select("id");

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/listings");
  return { success: true, count: data?.length ?? 0 };
}
