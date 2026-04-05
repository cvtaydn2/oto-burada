"use server";

import { profileUpdateSchema } from "@/lib/validators";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export interface ProfileActionState {
  error?: string;
  success?: string;
  fields?: {
    fullName?: string;
    phone?: string;
    city?: string;
    avatarUrl?: string;
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
