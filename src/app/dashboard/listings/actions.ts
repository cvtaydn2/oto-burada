"use server";

import { revalidatePath } from "next/cache";

import { archiveListingUseCase } from "@/domain/usecases/listing-archive";
import { bumpListingUseCase } from "@/domain/usecases/listing-bump";
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
