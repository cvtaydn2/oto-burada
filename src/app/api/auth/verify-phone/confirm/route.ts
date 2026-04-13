import { NextResponse } from "next/server";
import { verifyPhoneOTP } from "@/services/verification/phone-otp";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return NextResponse.json({ success: false, error: "Telefon ve kod gerekli." }, { status: 400 });
    }

    const verifyResult = await verifyPhoneOTP(phone, code);
    if (!verifyResult.success) {
      return NextResponse.json({ success: false, error: verifyResult.error }, { status: 400 });
    }

    // Update profile in database
    const supabase = await createSupabaseServerClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        phone: phone,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error after OTP:", updateError);
      return NextResponse.json({ success: false, error: "Profil güncellenemedi." }, { status: 500 });
    }

    if (hasSupabaseAdminEnv()) {
      const admin = createSupabaseAdminClient();
      const { data: authUserResult } = await admin.auth.admin.getUserById(user.id);
      const currentAppMetadata = (authUserResult.user?.app_metadata as Record<string, unknown> | undefined) ?? {};

      await admin.auth.admin.updateUserById(user.id, {
        app_metadata: {
          ...currentAppMetadata,
          phone_verified: true,
        },
      });
    }

    return NextResponse.json({ success: true, message: "Telefon numaranız başarıyla doğrulandı." });
  } catch (error) {
    console.error("API OTP Verify Error:", error);
    return NextResponse.json({ success: false, error: "Sunucu hatası." }, { status: 500 });
  }
}
