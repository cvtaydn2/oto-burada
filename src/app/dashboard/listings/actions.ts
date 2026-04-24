"use server";

import { revalidatePath } from "next/cache";

import { archiveListingUseCase } from "@/domain/usecases/listing-archive";
import { bumpListingUseCase } from "@/domain/usecases/listing-bump";
import { publishListingUseCase } from "@/domain/usecases/listing-publish";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
  if (!user) throw new Error("Unauthorized");

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("listings")
    .select("profiles(phone)")
    .eq("id", listingId)
    .single();

  const phone = (data?.profiles as unknown as { phone: string })?.phone || "";

  return { success: true, phone };
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

export async function bulkArchiveListingAction(ids: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await createSupabaseServerClient();
  const { error, data } = await supabase
    .from("listings")
    .update({
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .in("id", ids)
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

  // 1. Delete associated data
  await supabase.from("listing_images").delete().in("listing_id", ids);
  await supabase.from("favorites").delete().in("listing_id", ids);

  // 2. Delete listings
  const { error, data } = await supabase
    .from("listings")
    .delete()
    .in("id", ids)
    .eq("seller_id", user.id)
    .select("id");

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/listings");
  return { success: true, count: data?.length ?? 0 };
}
