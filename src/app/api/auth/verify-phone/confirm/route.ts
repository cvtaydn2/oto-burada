import { NextResponse } from "next/server";
import { verifyPhoneOTP } from "@/services/verification/phone-otp";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { logger } from "@/lib/utils/logger";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";

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

  const { phone, code } = body as { phone?: string; code?: string };
  if (!phone || !code) {
    return NextResponse.json({ success: false, error: "Telefon ve kod gerekli." }, { status: 400 });
  }

  try {
    const verifyResult = await verifyPhoneOTP(phone, code);
    if (!verifyResult.success) {
      return NextResponse.json({ success: false, error: verifyResult.error }, { status: 400 });
    }

    // Update profile phone
    const supabase = await createSupabaseServerClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ phone, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateError) {
      logger.auth.error("Profile phone update failed after OTP", updateError, { userId: user.id });
      captureServerError("Profile phone update failed after OTP", "auth", updateError, { userId: user.id });
      return NextResponse.json({ success: false, error: "Profil güncellenemedi." }, { status: 500 });
    }

    // Update auth metadata
    if (hasSupabaseAdminEnv()) {
      const admin = createSupabaseAdminClient();
      const { data: authUserResult } = await admin.auth.admin.getUserById(user.id);
      const currentAppMetadata = (authUserResult.user?.app_metadata as Record<string, unknown> | undefined) ?? {};
      await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { ...currentAppMetadata, phone_verified: true },
      });
    }

    captureServerEvent("auth_phone_verified", { userId: user.id }, user.id);
    return NextResponse.json({ success: true, message: "Telefon numaranız başarıyla doğrulandı." });
  } catch (error) {
    logger.auth.error("OTP confirm failed", error, { userId: user.id });
    captureServerError("OTP confirm failed", "auth", error, { userId: user.id });
    return NextResponse.json({ success: false, error: "Sunucu hatası." }, { status: 500 });
  }
}
