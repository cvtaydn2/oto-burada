"use server";

import { profileUpdateSchema } from "@/lib/validators";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { updateProfileTable, verifyProfileIdentity } from "@/services/profile/profile-records";

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
  formData: FormData,
): Promise<ProfileActionState> {
  void previousState;

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
  _previousState: ProfileActionState | undefined,
  formData: FormData,
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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Oturum dogrulanamadi.", fields: values };
  }

  // Update metadata for quick access
  await supabase.auth.updateUser({
    data: {
      business_name: parsed.data.businessName,
      business_slug: parsed.data.businessSlug,
    }
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
      user_type: 'professional' // Auto-upgrade to professional on filling these
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === '23505') {
       return { error: "Bu mağaza URL'i (slug) zaten kullanımda.", fields: values };
    }
    return { error: "Guncelleme sirasinda bir hata olustu.", fields: values };
  }

  return {
    success: "Kurumsal bilgileriniz başarıyla güncellendi.",
    fields: values,
  };
}

export async function verifyIdentityAction(
  userId: string,
  formData: FormData,
): Promise<{ success?: string; error?: string }> {
  const tcId = String(formData.get("tcId") ?? "");
  const fullName = String(formData.get("fullName") ?? "");

  if (!tcId || tcId.length !== 11) {
    return { error: "Lütfen 11 haneli geçerli bir TC Kimlik No girin." };
  }

  if (!fullName) {
    return { error: "Lütfen ad soyad bilgisini girin." };
  }

  // In a real app, you would call a 3rd party API (NVI KPS) here.
  // For this mock hardening, we simulate success if the fields are present.
  const result = await verifyProfileIdentity(userId, `EIDS-${tcId.slice(-4)}-${Date.now()}`);

  if (!result) {
    return { error: "Doğrulama işlemi başarısız oldu. Lütfen tekrar deneyin." };
  }

  return { success: "Kimliğiniz başarıyla doğrulandı!" };
}

