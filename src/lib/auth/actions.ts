"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AnalyticsEvent } from "@/lib/analytics/events";
import { logger } from "@/lib/logging/logger";
import { identifyServerUser, trackServerEvent } from "@/lib/monitoring/posthog-server";
import { checkBruteForceLimit } from "@/lib/rate-limiting/distributed-rate-limit";
import { rateLimitProfiles } from "@/lib/rate-limiting/rate-limit";
import { checkRateLimit } from "@/lib/rate-limiting/rate-limit-middleware";
import { rotateCsrfToken } from "@/lib/security/csrf";
import { isTurnstileEnabled, verifyTurnstileToken } from "@/lib/security/turnstile";
import { getAppUrl } from "@/lib/seo";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema, resetPasswordSchema } from "@/lib/validators";

export interface AuthActionResponse {
  success: boolean;
  error?: string;
  message?: string;
  fields?: {
    email?: string;
    fullName?: string;
  };
  fieldErrors?: Record<string, string[] | undefined>;
  reason?: string;
}

export type AuthActionState = AuthActionResponse | null;

const initialState: AuthActionResponse = {
  success: false,
};

// Shared safe-path validator — mirrors auth/callback/route.ts sanitizeNextParam.
// Accepts only relative paths with safe characters; rejects open-redirect attempts.
const ALLOWED_NEXT_PATHS = /^\/[a-zA-Z0-9\-_/?=&%#.]+$/;

function buildAuthErrorState(message: string, reason = "error"): AuthActionResponse {
  return {
    success: false,
    error: message,
    reason,
  };
}

// Helper functions will be deprecated in favor of direct returns for better DX
function buildAuthFields(
  email?: string,
  fullName?: string
): NonNullable<AuthActionResponse["fields"]> {
  return {
    email,
    ...(fullName !== undefined ? { fullName } : {}),
  };
}

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
  try {
    const url = new URL("/auth/callback", appUrl);
    return url.toString();
  } catch (error) {
    logger.auth.error("Failed to build redirect URL", error, { appUrl });
    // Fallback to relative path as a last resort, though Supabase usually requires absolute
    return "/auth/callback";
  }
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
  // Preserve fields from previous state

  const clientIp = await getClientIp();

  // 1. General IP rate limit (prevents massive volumetric attacks)
  const ipRateLimit = await checkRateLimit(`auth:login:${clientIp}`, rateLimitProfiles.auth);
  if (!ipRateLimit.allowed) {
    return buildAuthErrorState(
      "Çok fazla giriş denemesi yaptın. Lütfen biraz bekle ve tekrar dene."
    );
  }

  // 2. Brute-force protection: check if IP is currently locked out (PEEK ONLY)
  const bruteForce = await checkBruteForceLimit(clientIp, "login", { mode: "check" });
  if (!bruteForce.success) {
    return buildAuthErrorState(
      "Çok fazla deneme yaptınız. Güvenliğiniz için 15 dakika kısıtlandınız."
    );
  }

  const values = {
    email: String(formData.get("email") ?? ""),
    next: String(formData.get("next") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  // 3. Email-scoped rate limit: prevents credential stuffing on a single account
  const emailKey = values.email.toLowerCase().trim();
  if (emailKey) {
    const emailRateLimit = await checkRateLimit(`auth:login:email:${emailKey}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
      failClosed: true,
    });
    if (!emailRateLimit.allowed) {
      return buildAuthErrorState(
        "Bu hesap için çok fazla giriş denemesi yapıldı. Lütfen biraz bekle."
      );
    }
  }

  const parsed = loginSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ...previousState,
      success: false,
      error: "Lütfen formdaki hataları kontrol edin.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      fields: buildAuthFields(values.email),
      reason: "validation_error",
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      ...previousState,
      success: false,
      error: "Supabase ortam değişkenleri eksik. Giriş için .env.local dosyasını tamamlamalısın.",
      fields: buildAuthFields(values.email),
      reason: "env_missing",
    };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  // ── SECURITY FIX: Issue SEC-CSRF-01 - CSRF Token Rotation on Login ──────
  // Always rotate CSRF token upon successful authentication to prevent
  // session fixation attacks.
  if (!error) {
    await rotateCsrfToken();
  }

  if (error) {
    // Record failure for brute-force protection
    await checkBruteForceLimit(clientIp, "login", { mode: "increment" });

    return {
      ...previousState,
      success: false,
      error: "Giriş yapılamadı. E-posta veya şifreyi kontrol et.",
      fields: buildAuthFields(values.email),
      reason: "invalid_credentials",
    };
  }

  // 3. Enforce Email Verification (SEC-EMAIL-01)
  if (data.user && !data.user.email_confirmed_at) {
    return {
      ...previousState,
      success: false,
      error: "Lütfen devam etmeden önce e-posta adresinizi doğrulayın.",
      fields: buildAuthFields(values.email),
      reason: "email_not_confirmed",
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

    // Fix 4: Mask email domain only — never send full email to analytics
    const maskedEmail = data.user.email ? data.user.email.replace(/^[^@]+/, "***") : undefined;
    identifyServerUser(data.user.id, {
      email: maskedEmail,
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
  const clientIp = await getClientIp();

  // 1. General IP rate limit
  const ipRateLimit = await checkRateLimit(`auth:register:${clientIp}`, rateLimitProfiles.auth);
  if (!ipRateLimit.allowed) {
    return buildAuthErrorState(
      "Çok fazla kayıt denemesi yaptın. Lütfen biraz bekle ve tekrar dene."
    );
  }

  // 2. Brute-force protection: check if IP is currently locked out (PEEK ONLY)
  const bruteForce = await checkBruteForceLimit(clientIp, "register", { mode: "check" });
  if (!bruteForce.success) {
    return buildAuthErrorState(
      "Çok fazla deneme yaptınız. Güvenliğiniz için 15 dakika kısıtlandınız."
    );
  }

  // Verify Turnstile bot protection
  const turnstileToken = String(formData.get("turnstile_token") ?? "");
  if (isTurnstileEnabled()) {
    const isBotChallengePassed = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!isBotChallengePassed) {
      return buildAuthErrorState(
        "Güvenlik doğrulaması başarısız oldu. Lütfen sayfayı yenileyip tekrar deneyin.",
        "bot_detected"
      );
    }
  }

  const values = {
    email: String(formData.get("email") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  // 3. Email-scoped rate limit: prevents spam registrations for the same account
  const emailKey = values.email.toLowerCase().trim();
  if (emailKey) {
    const emailRateLimit = await checkRateLimit(`auth:register:email:${emailKey}`, {
      limit: 3,
      windowMs: 30 * 60 * 1000,
      failClosed: true,
    });
    if (!emailRateLimit.allowed) {
      return buildAuthErrorState(
        "Bu e-posta adresi ile çok fazla kayıt denemesi yapıldı. Lütfen biraz bekleyin."
      );
    }
  }

  const parsed = registerSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ...previousState,
      success: false,
      error: "Lütfen formdaki hataları kontrol edin.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      fields: buildAuthFields(values.email, values.fullName),
      reason: "validation_error",
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      ...previousState,
      success: false,
      error: "Supabase ortam değişkenleri eksik. Kayıt için .env.local dosyasını tamamlamalısın.",
      fields: buildAuthFields(values.email, values.fullName),
      reason: "env_missing",
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

  // ── SECURITY FIX: Issue SEC-CSRF-01 - CSRF Token Rotation on Register ───
  if (!error) {
    await rotateCsrfToken();
  }

  if (error) {
    // Record failure
    await checkBruteForceLimit(clientIp, "register", { mode: "increment" });

    return {
      ...previousState,
      success: false,
      error: "Kayıt oluşturulamadı. Lütfen tekrar dene.",
      fields: buildAuthFields(values.email, values.fullName),
      reason: "signup_error",
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

    // Fix 8: Profile Bootstrap Verification
    // Ensure the profile was created (either by trigger or manual).
    // If we're in a race condition where trigger is slow, we retry 3 times with exponential backoff.
    let profile = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: found } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();
      if (found) {
        profile = found;
        break;
      }
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 300));
    }

    if (!profile) {
      logger.auth.warn("Profile not found after retries (trigger failure?), creating manually...", {
        userId: data.user.id,
      });

      const supabaseAdmin = createSupabaseAdminClient();
      const { error: insertError } = await supabaseAdmin.from("profiles").insert({
        id: data.user.id,
        full_name: parsed.data.fullName,
      });

      if (insertError) {
        logger.auth.error("Manual profile creation failed", {
          userId: data.user.id,
          error: insertError,
        });
      }
    }

    // Fix 4: Mask email domain only — never send full email to analytics
    const maskedEmail = data.user.email ? data.user.email.replace(/^[^@]+/, "***") : undefined;
    identifyServerUser(data.user.id, {
      email: maskedEmail,
    });
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    success: true,
    message: "Hesabın oluşturuldu. E-posta doğrulaması açıksa gelen kutunu kontrol et.",
    fields: buildAuthFields(values.email, values.fullName),
  };
}

export async function forgotPasswordAction(
  _previousState: AuthActionState = initialState,
  formData: FormData
): Promise<AuthActionState> {
  void _previousState;
  const email = String(formData.get("email") ?? "").trim();

  const { z } = await import("zod");
  const parsed = z.string().email("Geçerli bir e-posta adresi girin.").safeParse(email);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
      fields: buildAuthFields(email),
      reason: "invalid_input",
    };
  }

  // 1. IP-based brute-force protection (PEEK ONLY)
  const clientIp = await getClientIp();
  const ipRateLimit = await checkBruteForceLimit(clientIp, "forgot-password", { mode: "check" });

  if (!ipRateLimit.success) {
    return buildAuthErrorState("Çok fazla şifre sıfırlama denemesi yaptın. Lütfen biraz bekle.");
  }

  // 2. Email-based brute-force protection (enumeration/targeted attack prevention)
  const emailKey = email.toLowerCase();
  const emailRateLimit = await checkRateLimit(
    `auth:forgot:${emailKey}`,
    rateLimitProfiles.forgotPassword
  );

  if (!emailRateLimit.allowed) {
    // SECURITY: Return generic success message even when rate limited by email
    // to prevent an attacker from knowing if an account exists or is locked.
    return {
      success: true,
      message: "Sıfırlama bağlantısı e-posta adresinize gönderildi.",
      fields: buildAuthFields(email),
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      success: false,
      error: "Servis şu anda kullanılamıyor.",
      fields: buildAuthFields(email),
      reason: "env_missing",
    };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getAppUrl()}/reset-password`,
  });

  if (error) {
    // Fix 9: Deterministic operational reason visibility
    // Map internal provider errors to safe, loggable reason codes for telemetry
    const errorMsg = error.message.toLowerCase();
    const reasonCode =
      error.status === 429
        ? "rate_limited"
        : errorMsg.includes("invalid email")
          ? "invalid_email"
          : errorMsg.includes("network")
            ? "network_error"
            : "provider_error";

    logger.auth.error(
      "Forgot password email dispatch failed",
      {
        reason: reasonCode,
        status: error.status,
      },
      {}
    );

    const isTemporaryFailure =
      error.status === 429 || /rate|limit|too many|temporar/i.test(error.message);

    // Record failure
    await checkBruteForceLimit(clientIp, "forgot-password", { mode: "increment" });

    return {
      success: false,
      error: isTemporaryFailure
        ? "İşlem şu anda geçici olarak yavaşlatıldı. Lütfen biraz sonra tekrar dene."
        : "İşlem şu anda tamamlanamıyor. Lütfen biraz sonra tekrar dene.",
      fields: buildAuthFields(email),
      reason: reasonCode,
    };
  }

  // Güvenlik: hesap var/yok bilgisi verme — her zaman başarı mesajı göster
  return {
    success: true,
    message: "Sıfırlama bağlantısı e-posta adresinize gönderildi.",
    fields: buildAuthFields(email),
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

  // not just the current cookie. This prevents sessions lingering on
  // other tabs or devices after an explicit logout.
  await supabase.auth.signOut({ scope: "global" });

  // ── SECURITY FIX: Issue SEC-CSRF-01 - CSRF Token Rotation on Logout ─────
  await rotateCsrfToken();

  redirect("/");
}

export async function resendVerificationAction(
  _state: AuthActionState = initialState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const clientIp = await getClientIp();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. IP-based brute-force protection (PEEK ONLY)
  // If user is logged in, we combine IP + userId for stricter protection
  const bruteForceIp = await checkBruteForceLimit(clientIp, "resend-verification", {
    limit: 3,
    windowMs: 60 * 60 * 1000, // 3 per hour
    userId: user?.id,
    mode: "check",
  });

  if (!bruteForceIp.success) {
    return buildAuthErrorState(
      "Çok fazla doğrulama isteği gönderildi. Lütfen bir saat sonra tekrar deneyin."
    );
  }

  // 2. Email-based brute-force protection
  if (email) {
    const emailKey = email.toLowerCase();
    const bruteForceEmail = await checkBruteForceLimit(emailKey, "resend-verification", {
      limit: 2,
      windowMs: 30 * 60 * 1000, // 2 per 30 mins
    });

    if (!bruteForceEmail.success) {
      return buildAuthErrorState(
        "Bu e-posta adresi için çok sık istek yapılıyor. Lütfen 30 dakika bekleyin."
      );
    }
  }

  if (!hasSupabaseEnv()) {
    return buildAuthErrorState("Servis şu anda kullanılamıyor.", "env_missing");
  }

  // If email is not provided, try to get it from current session
  let targetEmail = email;
  if (!targetEmail) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    targetEmail = user?.email ?? "";
  }

  if (!targetEmail) {
    return buildAuthErrorState("E-posta adresi bulunamadı.", "invalid_input");
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: targetEmail,
    options: {
      emailRedirectTo: getEmailRedirectUrl(),
    },
  });

  if (error) {
    // Record failure for brute-force protection
    await checkBruteForceLimit(clientIp, "resend-verification", {
      mode: "increment",
      userId: user?.id,
    });

    logger.auth.error("Resend verification failed", { error: error.message, email: targetEmail });
    return buildAuthErrorState(
      "Doğrulama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin.",
      "provider_error"
    );
  }

  return {
    success: true,
    message: "Doğrulama bağlantısı tekrar gönderildi. Lütfen gelen kutunuzu kontrol edin.",
  };
}

export async function updatePasswordAction(
  previousState: AuthActionState = initialState,
  formData: FormData
): Promise<AuthActionState> {
  const clientIp = await getClientIp();
  const supabase = await createSupabaseServerClient();

  // 1. Check authentication state
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return buildAuthErrorState("Bu işlemi yapabilmek için giriş yapmalısınız.", "unauthorized");
  }

  // 2. Combined IP + UserID brute-force protection (PEEK ONLY)
  const bruteForce = await checkBruteForceLimit(clientIp, "password-reset", {
    userId: user.id,
    limit: 5,
    windowMs: 15 * 60 * 1000, // 5 per 15 mins
    mode: "check",
  });

  if (!bruteForce.success) {
    return buildAuthErrorState(
      "Çok fazla deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin.",
      "rate_limited"
    );
  }

  const values = {
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  };

  const parsed = resetPasswordSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ...previousState,
      success: false,
      error: "Lütfen formdaki hataları kontrol edin.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      reason: "validation_error",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    // Record failure for brute-force protection
    await checkBruteForceLimit(clientIp, "password-reset", {
      mode: "increment",
      userId: user.id,
    });

    logger.auth.error("Password update failed", { error: error.message, userId: user.id });
    return buildAuthErrorState("Şifre güncellenemedi. Lütfen tekrar deneyin.", "update_error");
  }

  // 3. Security: Rotate CSRF token on privilege change
  await rotateCsrfToken();

  trackServerEvent(AnalyticsEvent.SERVER_AUTH_PASSWORD_RESET, { userId: user.id }, user.id);

  return {
    success: true,
    message: "Şifreniz başarıyla güncellendi.",
  };
}
