import { NextResponse } from "next/server";
import { verifyEmailOTP } from "@/services/verification/email-otp";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { logger } from "@/lib/utils/logger";
import { captureServerError } from "@/lib/monitoring/posthog-server";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "İstek gövdesi okunamadı." }, { status: 400 });
  }

  const { token } = body as { token?: string };
  if (!token) {
    return NextResponse.json({ success: false, error: "Doğrulama kodu gerekli." }, { status: 400 });
  }

  const email = user.email;
  if (!email) {
    return NextResponse.json({ success: false, error: "Hesabınızda e-posta adresi bulunamadı." }, { status: 400 });
  }

  try {
    const result = await verifyEmailOTP(email, token);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Mark email as verified in auth metadata
    if (hasSupabaseAdminEnv()) {
      const admin = createSupabaseAdminClient();
      const { data: authUserResult } = await admin.auth.admin.getUserById(user.id);
      const currentAppMetadata = (authUserResult.user?.app_metadata as Record<string, unknown> | undefined) ?? {};
      await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { ...currentAppMetadata, email_verified: true },
      });
    }

    return NextResponse.json({ success: true, message: "E-posta adresiniz başarıyla doğrulandı." });
  } catch (error) {
    logger.auth.error("Email OTP confirm route failed", error, { userId: user.id });
    captureServerError("Email OTP confirm route failed", "auth", error, { userId: user.id });
    return NextResponse.json({ success: false, error: "Sunucu hatası." }, { status: 500 });
  }
}
