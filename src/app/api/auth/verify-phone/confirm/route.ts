import { NextResponse } from "next/server";
import { verifyPhoneOTP } from "@/services/verification/phone-otp";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
        is_verified: true, // We could add a more specific phone_verified flag too
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error after OTP:", updateError);
      return NextResponse.json({ success: false, error: "Profil güncellenemedi." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Telefon numaranız başarıyla doğrulandı." });
  } catch (error) {
    console.error("API OTP Verify Error:", error);
    return NextResponse.json({ success: false, error: "Sunucu hatası." }, { status: 500 });
  }
}
