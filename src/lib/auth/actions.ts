"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AnalyticsEvent } from "@/lib/analytics/events";
import { identifyServerUser, trackServerEvent } from "@/lib/monitoring/posthog-server";
import { getAppUrl } from "@/lib/seo";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { checkRateLimit } from "@/lib/utils/rate-limit-middleware";
import { loginSchema, registerSchema } from "@/lib/validators";

export interface AuthActionState {
  error?: string;
  success?: string;
  fields?: {
    email?: string;
    fullName?: string;
  };
}

const initialState: AuthActionState = {};

// Shared safe-path validator — mirrors auth/callback/route.ts sanitizeNextParam.
// Accepts only relative paths with safe characters; rejects open-redirect attempts.
const ALLOWED_NEXT_PATHS = /^\/[a-zA-Z0-9\-_/?=&%#.]+$/;

function sanitizeRedirectPath(next: string | null | undefined): string {
  if (!next) return "/dashboard";
  // Must start with / but not //  (protocol-relative open redirect)
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  // Block /\  and /... traversal tricks
  if (/^\/[\\.]/.test(next)) return "/dashboard";
  // Block protocol-relative disguised as path  (e.g. /javascript:...)
  if (/^\/[a-z]+:/i.test(next)) return "/dashboard";
  // Allowlist: only safe URL characters
  if (!ALLOWED_NEXT_PATHS.test(next)) return "/dashboard";
  // Block admin redirect — prevents leaking admin status to attackers
  if (next.startsWith("/admin")) return "/dashboard";
  return next;
}

function getEmailRedirectUrl() {
  const appUrl = getAppUrl();
  return `${appUrl.replace(/\/$/, "")}/auth/callback`;
}

async function getClientIp() {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIp || "unknown";
}

export async function loginAction(
  previousState: AuthActionState = initialState,
  formData: FormData
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
      error: "Supabase ortam değişkenleri eksik. Giriş için .env.local dosyasını tamamlamalısın.",
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
    trackServerEvent(
      AnalyticsEvent.SERVER_AUTH_LOGIN,
      {
        userId: data.user.id,
        method: "email",
      },
      data.user.id
    );

    identifyServerUser(data.user.id, {
      email: data.user.email,
      role: (data.user.app_metadata as { role?: string } | undefined)?.role ?? "user",
    });
  }

  const nextPath = sanitizeRedirectPath(values.next);

  redirect(nextPath);
}

export async function registerAction(
  previousState: AuthActionState = initialState,
  formData: FormData
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
    fullName: String(formData.get("fullName") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = registerSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Bir hata oluştu. Lütfen tekrar dene.",
      fields: { email: values.email, fullName: values.fullName },
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      error: "Supabase ortam değişkenleri eksik. Kayıt için .env.local dosyasını tamamlamalısın.",
      fields: { email: values.email },
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: getEmailRedirectUrl(),
      data: {
        full_name: parsed.data.fullName,
      },
      // Do NOT set role in user_metadata — it is user-editable and cannot be
      // trusted for authorization. Role is managed via app_metadata (admin SDK only)
      // and the profiles.role column (RLS-protected).
    },
  });

  if (error) {
    return {
      error: "Kayıt oluşturulamadı. Lütfen tekrar dene.",
      fields: { email: values.email, fullName: values.fullName },
    };
  }

  if (data.user) {
    trackServerEvent(
      AnalyticsEvent.SERVER_AUTH_REGISTER,
      {
        userId: data.user.id,
        method: "email",
      },
      data.user.id
    );

    identifyServerUser(data.user.id, {
      email: data.user.email,
    });
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    success: "Hesabın oluşturuldu. E-posta doğrulaması açıksa gelen kutunu kontrol et.",
    fields: { email: values.email, fullName: values.fullName },
  };
}

export async function forgotPasswordAction(
  _previousState: AuthActionState | undefined,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email || !email.includes("@")) {
    return { error: "Geçerli bir e-posta adresi girin." };
  }

  if (!hasSupabaseEnv()) {
    return { error: "Servis şu anda kullanılamıyor." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getAppUrl()}/reset-password`,
  });

  if (error) {
    logger.auth.error("Forgot password email dispatch failed", error, { email });
    return {
      error: "İşlem şu anda tamamlanamıyor. Lütfen biraz sonra tekrar dene.",
      fields: { email },
    };
  }

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    trackServerEvent(AnalyticsEvent.SERVER_AUTH_LOGOUT, { userId: user.id }, user.id);
  }

  // scope: 'global' invalidates all sessions across devices/browsers,
  // not just the current cookie. This prevents sessions lingering on
  // other tabs or devices after an explicit logout.
  await supabase.auth.signOut({ scope: "global" });
  redirect("/");
}
