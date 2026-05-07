"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import {
  createOrUpdateDatabaseSavedSearch,
  deleteDatabaseSavedSearch,
  updateDatabaseSavedSearch,
} from "@/services/saved-searches/saved-search-records";
import { hasMeaningfulSavedSearchFilters } from "@/services/saved-searches/saved-search-utils";
import type { ListingFilters } from "@/types";

/**
 * Server Action to save a search filter combination.
 */
export async function saveSearchAction(
  filters: ListingFilters,
  notificationsEnabled: boolean = true
) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Lütfen önce giriş yapın." };
  }

  if (!hasMeaningfulSavedSearchFilters(filters)) {
    return { success: false, error: "Arama kaydetmek için en az bir filtre seçmelisin." };
  }

  try {
    const savedSearch = await createOrUpdateDatabaseSavedSearch(user.id, {
      filters,
      notificationsEnabled,
    });

    if (!savedSearch) {
      return { success: false, error: "Arama kaydedilemedi. Lütfen tekrar dene." };
    }

    revalidatePath("/dashboard/saved-searches");
    return { success: true, message: "Aramanız kaydedildi." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Bağlantı sırasında bir hata oluştu.",
    };
  }
}

/**
 * Server Action to toggle notification preferences for a saved search.
 */
export async function toggleSavedSearchNotificationsAction(searchId: string, enabled: boolean) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Lütfen önce giriş yapın." };
  }

  try {
    const updated = await updateDatabaseSavedSearch(user.id, searchId, {
      notificationsEnabled: enabled,
    });

    if (!updated) {
      return { success: false, error: "Kayıtlı arama güncellenemedi." };
    }

    revalidatePath("/dashboard/saved-searches");
    return { success: true, updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Bağlantı sırasında bir hata oluştu.",
    };
  }
}

/**
 * Server Action to delete a saved search.
 */
export async function deleteSavedSearchAction(searchId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Lütfen önce giriş yapın." };
  }

  try {
    const deleted = await deleteDatabaseSavedSearch(user.id, searchId);

    if (!deleted) {
      return { success: false, error: "Kayıtlı arama silinemedi." };
    }

    revalidatePath("/dashboard/saved-searches");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Bağlantı sırasında bir hata oluştu.",
    };
  }
}
