import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { logger } from "@/lib/utils/logger";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const { planId } = await req.json();

    if (!planId) {
      return NextResponse.json({ success: false, error: "Plan ID gerekli." }, { status: 400 });
    }

    // TODO: Iyzico payment integration
    // For now, return a clear "not yet available" response
    logger.payments.info("Plan purchase attempted", { planId, userId: user.id });

    return NextResponse.json({
      success: false,
      error: "Ödeme sistemi henüz aktif değil. Lütfen bizimle iletişime geçin.",
    }, { status: 503 });

  } catch (error) {
    logger.payments.error("Purchase plan error", error);
    return NextResponse.json({ success: false, error: "Sunucu hatası." }, { status: 500 });
  }
}
