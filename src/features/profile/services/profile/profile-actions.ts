"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

import { requireUser } from "@/features/auth/lib/session";
import {
  buildProfileFromAuthUser,
  getStoredProfileById,
  updateUserProfile,
} from "@/features/profile/services/profile-records";
import {
  getLiveMarketplaceReferenceData,
  mergeCityOptions,
} from "@/features/shared/services/live-reference-data";
import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/server";

import {
  ProfileActionResult,
  ProfileUpdateInput,
  profileUpdateInputSchema,
} from "../../lib/profile-validators";
import { buildProfilePageData, ProfilePageData } from "./profile-logic";

export async function getDashboardProfilePageData(): Promise<{
  viewData: ProfilePageData;
  cityOptions: string[];
  userEmail: string;
}> {
  const user = await requireUser();

  const [storedProfile, references] = await Promise.all([
    getStoredProfileById(user.id),
    getLiveMarketplaceReferenceData(),
  ]);

  const profile = storedProfile ?? buildProfileFromAuthUser(user);
  const cityOptionsList = mergeCityOptions(references.cities, [profile.city]);

  const viewData = buildProfilePageData(profile);

  return {
    viewData,
    cityOptions: cityOptionsList.map((c) => c.city),
    userEmail: user.email ?? "",
  };
}

export async function updateProfileInformationAction(
  input: ProfileUpdateInput
): Promise<ProfileActionResult> {
  // 1. Secure auth
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Oturum doğrulanmadı. Lütfen tekrar giriş yapın.",
    };
  }

  // 2. Validate shape
  const parsed = profileUpdateInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Lütfen alanları kontrol edin.",
    };
  }

  try {
    // 3. Apply primary DB mutation with user-scoped RLS path
    const updatedProfile = await updateUserProfile(
      user.id,
      {
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        city: parsed.data.city,
        avatarUrl: parsed.data.avatarUrl === "" ? null : parsed.data.avatarUrl,
      },
      supabase as unknown as SupabaseClient
    );

    if (!updatedProfile) {
      logger.auth.error("[Profile] DB table update failed", null, { userId: user.id });
      return {
        status: "error",
        message: "Profil kaydı güncellenemedi. Lütfen tekrar deneyin.",
      };
    }

    // 4. Fire Secondary Cached Update (Supabase Metadata)
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone,
        city: parsed.data.city,
        avatar_url: parsed.data.avatarUrl === "" ? null : parsed.data.avatarUrl,
      },
    });

    if (authError) {
      logger.auth.warn("[Profile] Metadata sync lag", { userId: user.id }, authError);
      return {
        status: "success",
        message: "Profil güncellendi (Auth verisi yolda).",
      };
    }

    return {
      status: "success",
      message: "Profil bilgileriniz başarıyla kaydedildi.",
    };
  } catch (err) {
    logger.auth.error("[Profile] Action crash", null, { userId: user.id, err });
    return {
      status: "error",
      message: "İşlem sırasında teknik bir hata oluştu.",
    };
  }
}
