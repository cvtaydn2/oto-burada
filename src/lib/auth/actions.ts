"use server";

import { redirect } from "next/navigation";

import { loginSchema, registerSchema } from "@/lib/validators";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export interface AuthActionState {
  error?: string;
  success?: string;
  fields?: {
    email?: string;
  };
}

const initialState: AuthActionState = {};

function getEmailRedirectUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl.replace(/\/$/, "")}/auth/callback`;
}

export async function loginAction(
  previousState: AuthActionState = initialState,
  formData: FormData,
): Promise<AuthActionState> {
  void previousState;

  const values = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Bir hata oluştu. Lütfen tekrar dene.",
      fields: { email: values.email },
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      error:
        "Supabase ortam değişkenleri eksik. Giriş için .env.local dosyasını tamamlamalısın.",
      fields: { email: values.email },
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      error: "Giriş yapılamadı. E-posta veya şifreyi kontrol et.",
      fields: { email: values.email },
    };
  }

  redirect("/dashboard");
}

export async function registerAction(
  previousState: AuthActionState = initialState,
  formData: FormData,
): Promise<AuthActionState> {
  void previousState;

  const values = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = registerSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Bir hata oluştu. Lütfen tekrar dene.",
      fields: { email: values.email },
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      error:
        "Supabase ortam değişkenleri eksik. Kayıt için .env.local dosyasını tamamlamalısın.",
      fields: { email: values.email },
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: getEmailRedirectUrl(),
    },
  });

  if (error) {
    return {
      error: "Kayıt oluşturulamadı. Lütfen tekrar dene.",
      fields: { email: values.email },
    };
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    success:
      "Hesabın oluşturuldu. E-posta doğrulaması açıksa gelen kutunu kontrol et.",
    fields: { email: values.email },
  };
}

export async function logoutAction() {
  if (!hasSupabaseEnv()) {
    redirect("/");
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
