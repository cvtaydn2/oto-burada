"use server";

import { revalidatePath } from "next/cache";

import { favoriteAddUseCase } from "@/domain/usecases/favorite-add";
import { favoriteRemoveUseCase } from "@/domain/usecases/favorite-remove";
import { getCurrentUser } from "@/features/auth/lib/session";

export async function toggleFavoriteAction(listingId: string, isFavorited: boolean) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  let result;
  if (isFavorited) {
    result = await favoriteRemoveUseCase(user.id, listingId);
  } else {
    result = await favoriteAddUseCase(user.id, listingId);
  }

  if (result.success) {
    revalidatePath("/dashboard/favorites");
    revalidatePath("/favorites");
    revalidatePath(`/listing/${listingId}`); // Simplified, real app needs slug
  }

  return result;
}
