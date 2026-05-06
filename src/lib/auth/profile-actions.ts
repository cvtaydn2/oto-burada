"use server";

import { logger } from "@/lib/logging/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { profileUpdateSchema } from "@/lib/validators";
import { updateProfileTable } from "@/services/profile/profile-records";

export interface ProfileActionState {
  error?: string;
  success?: string;
  fields?: {
    fullName?: string;
    phone?: string;
    city?: string;
    avatarUrl?: string;

    // Corporate fields
    businessName?: string;
    businessSlug?: string;
    businessAddress?: string;
    businessDescription?: string;
    taxId?: string;
    taxOffice?: string;
    websiteUrl?: string;
    businessLogoUrl?: string;
  };
}

const initialState: ProfileActionState = {};

export async function updateProfileAction(
  _previousState: ProfileActionState = initialState,
  formData: FormData
): Promise<ProfileActionState> {
  void _previousState;
  const values = {
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    city: String(formData.get("city") ?? ""),
    avatarUrl: String(formData.get("avatarUrl") ?? ""),
  };

  const parsed = profileUpdateSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Bir hata oluştu. Lütfen tekrar dene.",
      fields: values,
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      error:
        "Supabase ortam değişkenleri eksik. Profili güncellemek için .env.local dosyasını tamamlamalısın.",
      fields: values,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: "Oturum doğrulanamadı. Lütfen tekrar giriş yap.",
      fields: values,
    };
  }

  // 1. Update Profile Table First (Primary DB Truth)
  const profile = await updateProfileTable(user.id, {
    fullName: parsed.data.fullName,
    phone: parsed.data.phone,
    city: parsed.data.city,
    avatarUrl: parsed.data.avatarUrl ?? null,
  });

  if (!profile) {
    logger.auth.error("[Profile] Table update failed (null result)", null, { userId: user.id });
    return {
      error: "Profil veritabanı güncellenemedi. Lütfen tekrar dene.",
      fields: values,
    };
  }

  // 2. Update Auth Metadata (Secondary Cache)
  const { error: authError } = await supabase.auth.updateUser({
    data: {
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      city: parsed.data.city,
      avatar_url: parsed.data.avatarUrl ?? null,
    },
  });

  if (authError) {
    // DB is updated, but Auth metadata failed. Log and inform user.
    logger.auth.warn(
      "[Profile] Auth metadata update failed after DB update",
      { userId: user.id },
      authError
    );
    return {
      success: "Profil güncellendi (Auth metadata gecikmeli güncellenebilir).",
      fields: {
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        city: parsed.data.city,
        avatarUrl: parsed.data.avatarUrl ?? "",
      },
    };
  }

  return {
    success: "Profil bilgilerin güncellendi.",
    fields: {
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      city: parsed.data.city,
      avatarUrl: parsed.data.avatarUrl ?? "",
    },
  };
}

export async function updateCorporateProfileAction(
  _previousState: ProfileActionState = initialState,
  formData: FormData
): Promise<ProfileActionState> {
  void _previousState;
  const values = {
    businessName: String(formData.get("businessName") ?? ""),
    businessSlug: String(formData.get("businessSlug") ?? ""),
    businessAddress: String(formData.get("businessAddress") ?? ""),
    businessDescription: String(formData.get("businessDescription") ?? ""),
    taxId: String(formData.get("taxId") ?? ""),
    taxOffice: String(formData.get("taxOffice") ?? ""),
    websiteUrl: String(formData.get("websiteUrl") ?? ""),
    businessLogoUrl: String(formData.get("businessLogoUrl") ?? ""),
  };

  const { corporateProfileSchema } = await import("@/lib/validators");
  const parsed = corporateProfileSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Bir hata oluştu.",
      fields: values,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Oturum dogrulanamadi.", fields: values };
  }

  const admin = createSupabaseAdminClient();
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("verification_status, is_banned, business_slug, user_type")
    .eq("id", user.id)
    .maybeSingle<{
      verification_status: string | null;
      is_banned: boolean | null;
      business_slug: string | null;
      user_type: string | null;
    }>();

  const oldSlug = existingProfile?.business_slug;
  const canActAsBusiness =
    existingProfile?.verification_status === "approved" && !existingProfile?.is_banned;

  // Update metadata for quick access
  await supabase.auth.updateUser({
    data: {
      business_name: parsed.data.businessName,
      business_slug: parsed.data.businessSlug,
    },
  });

  // Update table
  const { error } = await supabase
    .from("profiles")
    .update({
      business_name: parsed.data.businessName,
      business_slug: parsed.data.businessSlug,
      business_address: parsed.data.businessAddress,
      business_description: parsed.data.businessDescription,
      tax_id: parsed.data.taxId,
      tax_office: parsed.data.taxOffice,
      website_url: parsed.data.websiteUrl,
      business_logo_url: parsed.data.businessLogoUrl,
      user_type: canActAsBusiness
        ? "professional"
        : existingProfile?.user_type === "professional"
          ? "professional"
          : "individual",
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      if (oldSlug === parsed.data.businessSlug) {
        return {
          error: "Beklenmedik bir hata oluştu. Lütfen destek ekibiyle iletişime geçin.",
          fields: values,
        };
      }
      return { error: "Bu mağaza URL'i (slug) zaten kullanımda.", fields: values };
    }
    return { error: "Güncelleme sırasında bir hata oluştu.", fields: values };
  }

  // Revalidate paths for the gallery
  const { revalidatePath } = await import("next/cache");
  if (oldSlug) revalidatePath(`/galeri/${oldSlug}`);
  revalidatePath(`/galeri/${parsed.data.businessSlug}`);

  return {
    success: "Kurumsal bilgileriniz başarıyla güncellendi.",
    fields: values,
  };
}

export async function deleteProfileAction(): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Oturum doğrulanamadı. Lütfen tekrar giriş yap." };
  }

  const { error: rpcError } = await supabase.rpc("soft_delete_profile", {
    p_user_id: user.id,
  });

  if (rpcError) {
    logger.auth.error("[Profile] GDPR soft delete RPC failed", null, {
      userId: user.id,
      error: rpcError,
    });
    return { error: "Profil silinemedi: " + rpcError.message };
  }

  // Sign out user after successful soft delete
  await supabase.auth.signOut();

  return { success: true };
}
