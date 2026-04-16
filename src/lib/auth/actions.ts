"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { loginSchema, registerSchema } from "@/lib/validators";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { checkRateLimit } from "@/lib/utils/rate-limit-middleware";
import { captureServerEvent } from "@/lib/monitoring/posthog-server";

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

async function getClientIp() {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  return (forwarded?.split(",")[0]?.trim() || realIp || "unknown");
}

export async function loginAction(
  previousState: AuthActionState = initialState,
  formData: FormData,
): Promise<AuthActionState> {
  void previousState;

  const clientIp = await getClientIp();
  const ipRateLimit = await checkRateLimit(`auth:login:${clientIp}`, rateLimitProfiles.auth);

  if (!ipRateLimit.allowed) {
    return {
      error: "Çok fazla giriş denemesi yaptın. Lütfen biraz bekle ve tekrar dene.",
    };
  }

  const values = {
    email: String(formData.get("email") ?? ""),
    next: String(formData.get("next") ?? ""),
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

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      error: "Giriş yapılamadı. E-posta veya şifreyi kontrol et.",
      fields: { email: values.email },
    };
  }

  if (data.user) {
    captureServerEvent("auth_login_success", {
      userId: data.user.id,
    });
  }

  const nextPath =
    values.next.startsWith("/") && !values.next.startsWith("//")
      ? values.next
      : "/dashboard";

  redirect(nextPath);
}

export async function registerAction(
  previousState: AuthActionState = initialState,
  formData: FormData,
): Promise<AuthActionState> {
  void previousState;

  const clientIp = await getClientIp();
  const ipRateLimit = await checkRateLimit(`auth:register:${clientIp}`, rateLimitProfiles.auth);

  if (!ipRateLimit.allowed) {
    return {
      error: "Çok fazla kayıt denemesi yaptın. Lütfen biraz bekle ve tekrar dene.",
    };
  }

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
      data: {
        role: "user",
      },
    },
  });

  if (error) {
    return {
      error: "Kayıt oluşturulamadı. Lütfen tekrar dene.",
      fields: { email: values.email },
    };
  }

  if (data.user) {
    captureServerEvent("auth_register_success", {
      userId: data.user.id,
    });
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

export async function forgotPasswordAction(
  _previousState: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email || !email.includes("@")) {
    return { error: "Geçerli bir e-posta adresi girin." };
  }

  if (!hasSupabaseEnv()) {
    return { error: "Servis şu anda kullanılamıyor." };
  }

  const { sendPasswordResetEmail } = await import("@/services/verification/email-otp");
  await sendPasswordResetEmail(email);

  // Güvenlik: hesap var/yok bilgisi verme — her zaman başarı mesajı göster
  return {
    success: "Sıfırlama bağlantısı e-posta adresinize gönderildi.",
    fields: { email },
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
