"use server";

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
  previousState: ProfileActionState = initialState,
  formData: FormData
): Promise<ProfileActionState> {
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

  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      city: parsed.data.city,
      avatar_url: parsed.data.avatarUrl ?? null,
    },
  });

  if (error) {
    return {
      error: "Profil güncellenemedi. Lütfen tekrar dene.",
      fields: values,
    };
  }

  await updateProfileTable(user.id, {
    fullName: parsed.data.fullName,
    phone: parsed.data.phone,
    city: parsed.data.city,
    avatarUrl: parsed.data.avatarUrl ?? null,
  });

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
  previousState: ProfileActionState = initialState,
  formData: FormData
): Promise<ProfileActionState> {
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

// verifyIdentityAction — E-Devlet entegrasyonu hazır olduğunda buraya eklenecek
